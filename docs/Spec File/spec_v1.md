# RootedRewards — Backend Specification v1

**Programme:** RootedRewards (Zaad → Boom → Bos)
**Project:** Budget Thuis Hackathon 2026
**Document type:** Backend build specification
**Status:** Working draft — values are illustrative and subject to calibration before launch
**Last updated:** 2026-06-03

---

## 1. Overview

RootedRewards is a customer loyalty programme for Budget Thuis. Customers earn Seeds by taking commercially and behaviourally aligned actions. Seeds accumulate within an annual reward period and determine the customer's tier (Zaad / Boom / Bos), which in turn applies a multiplier to all subsequent earnings. Tier is a lifetime status — it only moves upward and is preserved across annual resets.

The backend is a single **.NET 10** service (`RootedRewards.Service`) with two entry points:

| Entry point | Type | Purpose |
|---|---|---|
| `BatchJob` | Scheduled worker (CronJob) | Weekly seed evaluation engine |
| `RewardsApi` | ASP.NET Core Minimal API | Read balance + close period (billing + app) |

Both entry points share the same engine, rule handlers, repositories, and database. There is no admin UI at v1 — trigger management is via direct database configuration.

**Deployment target:** Kubernetes  
**Database:** SQL Server (Entity Framework Core 10, code-first migrations)  
**Protocol:** REST (JSON) for the API; internal for the batch

---

## 2. Domain Concepts

| Term | Definition |
|---|---|
| **Seed** | The unit of loyalty currency. Earned by qualifying actions. Never goes below 0. |
| **BaseSeedsValue** | The seed value of a trigger before tier multiplier is applied. Negative for penalties. |
| **SeedsAwarded** | `BaseSeedsValue × MultiplierApplied`. Stored in the ledger. |
| **RewardPeriod** | One annual cycle per customer. Starts on contract activation (or programme enrolment). Resets on billing invoice. |
| **Tier** | Lifetime loyalty status: Zaad (1×), Boom (1.5×), Bos (2×). Only moves upward. |
| **TriggerDefinition** | A database-configured rule that the batch engine evaluates. Adding a new trigger = INSERT, no code change needed unless a new `RuleType` is introduced. |
| **BatchRun** | A weekly execution of the engine (runs every Wednesday, evaluating Mon–Tue data). |
| **Harvest Hours** | The named energy-shifting feature. Uses the `WindowedAggregate` rule type against hourly meter data. |

---

## 3. Tier System

Tiers are determined by `TotalSeeds` in the **current** period, with alternative qualification routes. Tier reassessment is **continuous** — the `TierEvaluator` runs after every seed award in the batch loop.

| Tier | Dutch name | Seeds threshold | Multiplier | Alternative route |
|---|---|---|---|---|
| 🌱 Zaad | Zaad | 0 – 2,499 | **1×** | Default — all customers from day 1 |
| 🌳 Boom | Boom | 2,500 – 5,999 | **1.5×** | OR year 2+ with any engagement |
| 🌲 Bos | Bos | 6,000+ | **2×** | OR 5+ contract years OR full bundle (Energie + Internet + Mobiel) |

**Rules:**
- Tiers only move upward. A customer who reaches Bos stays at Bos in all future periods even after reset.
- Multiplier is applied **at earn time**, not at period close. Both `BaseSeeds` and `MultiplierApplied` are stored in `SeedsLedger` for transparency.
- The `TierEvaluator` checks thresholds after every award and upgrades `Customer.CurrentTier` when crossed. Upgrades are idempotent.

---

## 4. Reward Period Lifecycle

```
Contract activation
       │
       ▼
RewardPeriod created (Status = Active, TotalSeeds = 0)
       │
       ▼
Weekly batch runs (Wednesday) ──► Seeds awarded ──► TierEvaluator checks threshold
       │
       ▼
Billing system creates annual invoice
       │
       ▼
POST /api/customers/{id}/reward-period/close called
       │
       ├── PeriodEnd set, Status = Closed, InvoicedAt set
       ├── New RewardPeriod opened (TotalSeeds = 0)
       └── CurrentTier preserved (NOT reset)
```

**Key rules:**
- All contract types (Fixed1Year, Fixed3Year, Variable, Dynamic) enrol from **day 1**.
- The existing year-1 cashback for fixed contracts runs **independently** and is not affected by RootedRewards.
- On churn: `SeedsPreservedUntil` is set to `churn date + 1 year`. Returning customers within this window resume their existing balance and tier.
- `/close` resets `TotalSeeds` to 0 on the **new** period only. It does **not** touch `CurrentTier`.

---

## 5. Seed Cap and Penalties

| Setting | Value (illustrative) |
|---|---|
| Seeds cap per period | 10,000 seeds |
| Penalty floor | 0 (balance never goes negative) |

**Penalties:**

| Trigger | Seeds | Notes |
|---|---|---|
| Smart meter remote read disabled | −90 / yr | Also blocks all P4-dependent triggers |
| Early cancellation (fixed contract) | Prorated | `days active / contract days × BaseSeedsValue` |
| Switching to another supplier | −300 at churn | Floor 0. Seeds preserved for 1 year via `SeedsPreservedUntil`. |

Penalties are recorded as reversal entries in `SeedsLedger` (`IsReversal = true`) to keep the audit trail clean.

---

## 6. Seeds Catalogue

All values are illustrative. `Readiness` indicates implementation complexity.

### 6.1 Contract & Lifecycle

| Trigger | Seeds | Frequency | Readiness |
|---|---|---|---|
| Signup bonus (first programme activation) | +1,000 | OnceOff | Ready now |
| Renew contract (year 1 → year 2) | +200 | Annual | Ready now |
| Renew on 3-year fixed contract | +300 | Annual | Ready now |
| Stay with BT when moving address | +500 | OnceOff | Ready now |
| Clean year (no complaint or late payment) | +250 | Annual | Ready now |

### 6.2 App & Data Engagement

| Trigger | Seeds | Frequency | Readiness |
|---|---|---|---|
| App activated (first login to MijnBudget) | +150 | OnceOff | Ready now |
| Opt-in: renewal communication | +200 | OnceOff | Ready now |
| Opt-in: app analytics / CRM tracking | +150 | OnceOff | Ready now |
| Opt-in: gratis stroom | +150 | Annual | Ready now |
| Day-ahead tariff checks in app (min 4×/month) | +100 | Monthly | Ready now |
| Smart meter remote read enabled | +100 | Annual | Ready now |
| Install smart meter (was conventional) | +400 | OnceOff | Ready now |
| Register solar panels | +300 | OnceOff | Ready now |

### 6.3 Harvest Hours (Energy Shifting)

| Trigger | Seeds | Frequency | Readiness |
|---|---|---|---|
| Gratis stroom: consumption > production (opted in) | +10 / day | Daily | Ready now |
| Harvest Hours shift (not opted in, same window) | +20 / day | Daily | Ready now |

**Conditions for both:** solar panels registered (`MeterFlowDirection = 'combination'`), data must be actual (not interpolated), window is weekends 12:00–17:00, April–September.

**Note:** Higher reward for non-opted-in customers is intentional — they receive no tariff discount, so the programme compensates with more seeds to incentivise the same grid-balancing behaviour.

### 6.4 Energy Behaviour

| Trigger | Seeds | Frequency | Readiness |
|---|---|---|---|
| Green energy proposition active | +100 | Annual | Ready now |
| Electricity below peer household benchmark | +200 | Annual | Needs data work |
| Gas below peer household benchmark | +200 | Annual | Needs data work |
| Year-on-year gas reduction | +150 | Annual | Needs data work |
| Year-on-year electricity reduction | +150 | Annual | Needs data work |
| Home battery registered (BT product) | +250 | Annual | New infra |
| Heat pump registered (replacing gas) | +400 | OnceOff | New infra |
| EV charger registered at address | +250 | OnceOff | New infra |

### 6.5 Multi-Product

| Trigger | Seeds | Frequency | Readiness |
|---|---|---|---|
| Combi-korting eligible (2 products: Energie + 1 other) | +200 | Annual | Ready now |
| Combi-korting eligible (3 products: Energie + Internet + Mobiel) | +350 | Annual | Ready now |
| Adding a new BT product (cross-sell event) | +250 | OnceOff | Ready now |
| Referring a friend who becomes a customer (max 3/yr) | +300 | OnceOff | Ready now |

---

## 7. Data Model

Six tables. EF Core code-first. No raw API response data is stored — only decisions and outcomes.

### 7.1 Customer

```csharp
public class Customer
{
    public int Id { get; set; }                        // PK — internal
    public string ExternalCustomerId { get; set; }     // Shared key across BT systems; used in API URLs
    public string ContractNumber { get; set; }
    public string MeterEan { get; set; }
    public string MeterFlowDirection { get; set; }     // 'combination' = solar panels registered
    public string ContractType { get; set; }           // Fixed1Year | Fixed3Year | Variable | Dynamic
    public DateTime ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }     // Null for open-ended contracts
    public bool GratisStroomOptIn { get; set; }        // Set by app opt-in event
    public bool RemoteReadEnabled { get; set; }        // Set by grid operator status
    public bool SolarPanelsRegistered { get; set; }    // Derived from MeterFlowDirection
    public string CurrentTier { get; set; }            // Zaad | Boom | Bos — only moves upward
    public DateTime? TierAchievedAt { get; set; }      // When current tier was first reached
    public DateTime? SeedsPreservedUntil { get; set; } // Set on churn; grace period expiry (1 year)
}
```

### 7.2 TriggerDefinition

```csharp
public class TriggerDefinition
{
    public int Id { get; set; }
    public string Name { get; set; }                   // Human-readable; shown in app ledger
    public string Description { get; set; }
    public string EndpointUrl { get; set; }            // Supports {CustomerId}, {PeriodFrom}, {PeriodTo}
    public string EndpointType { get; set; }           // REST | SOAP
    public string? SoapAction { get; set; }            // SOAPAction header value; SOAP only
    public string? RequestBodyTemplate { get; set; }   // XML envelope with placeholders; SOAP only
    public string ResponseMapping { get; set; }        // Flat JSON schema hint — field names and types
    public string RuleType { get; set; }               // BooleanFlag | ValueComparison | FieldComparison | WindowedAggregate
    public string RuleParameters { get; set; }         // JSON — rule-type specific config
    public int BaseSeedsValue { get; set; }            // Base seeds before multiplier. Negative for penalties.
    public string Frequency { get; set; }              // Daily | Weekly | Annual | OnceOff
    public bool IsActive { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }             // Null = no expiry
}
```

### 7.3 RewardPeriod

```csharp
public class RewardPeriod
{
    public int Id { get; set; }
    public int CustomerId { get; set; }                // FK → Customer
    public DateTime PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }           // Null until closed by billing event
    public int TotalSeeds { get; set; }                // Running sum (after multiplier). Updated per batch.
    public string Status { get; set; }                 // Active | Closed
    public DateTime? InvoicedAt { get; set; }          // Set when /close is called
    public string? InvoiceReference { get; set; }      // Billing system invoice identifier
}
```

### 7.4 SeedsLedger

```csharp
public class SeedsLedger
{
    public int Id { get; set; }
    public int RewardPeriodId { get; set; }            // FK → RewardPeriod
    public int TriggerDefinitionId { get; set; }       // FK → TriggerDefinition
    public int BatchRunId { get; set; }                // FK → BatchRun
    public DateTime EvaluatedOn { get; set; }          // When the batch processed this entry
    public DateTime EventDate { get; set; }            // Actual date the behaviour occurred
    public int BaseSeeds { get; set; }                 // Seeds before multiplier
    public decimal MultiplierApplied { get; set; }     // Tier multiplier at earn time (1.0, 1.5, 2.0)
    public int SeedsAwarded { get; set; }              // Final seeds after multiplier. Negative for penalties.
    public string Outcome { get; set; }                // Awarded | Skipped | Invalidated | Reversed
    public string OutcomeDetail { get; set; }          // Human-readable reason; shown in customer app
    public bool IsReversal { get; set; }               // True for penalties and proration adjustments
}
```

### 7.5 BatchRun

```csharp
public class BatchRun
{
    public int Id { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime PeriodFrom { get; set; }           // Monday of the evaluated week
    public DateTime PeriodTo { get; set; }             // Tuesday of the evaluated week
    public string Status { get; set; }                 // Running | Completed | Failed
    public int CustomersProcessed { get; set; }
    public int TriggersEvaluated { get; set; }
    public string? ErrorSummary { get; set; }          // Aggregated errors if partial failure
}
```

### 7.6 TierHistory *(new in v1)*

```csharp
public class TierHistory
{
    public int Id { get; set; }
    public int CustomerId { get; set; }                // FK → Customer
    public string FromTier { get; set; }               // Previous tier
    public string ToTier { get; set; }                 // New tier
    public DateTime AchievedAt { get; set; }           // When threshold was crossed
    public int TotalSeedsAtPromotion { get; set; }     // Snapshot of TotalSeeds at promotion time
}
```

---

## 8. Application Structure

```
RootedRewards.Service/
├── EntryPoints/
│   ├── BatchJob/
│   │   └── BatchOrchestrator.cs         // Resolves batch window, loads customers + triggers, runs evaluation loop
│   └── RewardsApi/
│       └── Program.cs                   // Minimal API — /current and /close endpoints
│
├── Engine/
│   ├── TriggerEvaluator.cs              // Selects client, calls API, applies tier multiplier, delegates to handler, writes ledger
│   └── TierEvaluator.cs                 // Checks thresholds after each award; upgrades Customer.CurrentTier (upward only)
│
├── Handlers/
│   ├── BooleanFlagHandler.cs            // Evaluates single boolean field against expected value
│   ├── ValueComparisonHandler.cs        // Evaluates field against a literal value (any operator)
│   ├── FieldComparisonHandler.cs        // Compares two fields from the same API response
│   └── WindowedAggregateHandler.cs      // Filters list by time window, aggregates, compares (used by Harvest Hours)
│
├── Clients/
│   ├── RestApiClient.cs                 // HttpClient wrapper; JSON → dynamic
│   └── SoapHttpClient.cs                // HttpClient wrapper with SOAPAction header; XML → dynamic
│
├── Infrastructure/
│   ├── DynamicResponseResolver.cs       // Navigates dynamic object by dot-notation path
│   ├── UrlTemplateResolver.cs           // Interpolates {CustomerId}, {PeriodFrom}, {PeriodTo}
│   └── IdempotencyGuard.cs              // Checks (RewardPeriodId, TriggerDefinitionId, EventDate) before insert
│
├── Services/
│   └── RewardPeriodService.cs           // Shared: query balance, tier progress, close period
│
└── Data/
    ├── RootedRewardsDbContext.cs
    └── Migrations/
```

---

## 9. API Contract

The service exposes two endpoints. The billing system and the app are the only consumers.

### GET /api/customers/{externalCustomerId}/reward-period/current

Returns the current seeds balance, tier, and progress to next tier.

**Response (200 OK):**
```json
{
  "customerId": "string",
  "periodStart": "2026-01-15",
  "currentSeeds": 2840,
  "cap": 10000,
  "currentTier": "Boom",
  "multiplier": 1.5,
  "seedsToNextTier": 3160,
  "nextTier": "Bos",
  "status": "Active"
}
```

**Response (404 Not Found):** Customer or active period not found.

---

### POST /api/customers/{externalCustomerId}/reward-period/close

Called by the billing system after invoice creation. Closes the active period and opens a new one. Seeds reset to 0; tier is preserved.

**Request body:**
```json
{
  "invoiceDate": "2026-06-01",
  "invoiceReference": "INV-2026-00123"
}
```

**Response (200 OK):**
```json
{
  "customerId": "string",
  "closedPeriodId": 42,
  "finalSeeds": 3840,
  "newPeriodId": 43,
  "newPeriodStart": "2026-06-01",
  "tierRetained": "Boom"
}
```

**Response (404 Not Found):** No active period found.  
**Response (409 Conflict):** Period already closed.

> **Note:** RootedRewards does not calculate or return any monetary discount. The billing system owns that logic. This endpoint provides `finalSeeds` as an informational audit field only.

---

## 10. Batch Processing Flow

```
Wednesday CronJob trigger
       │
       ▼
BatchOrchestrator
  ├── Resolve batch window (Mon 00:00 → Tue 23:59)
  ├── Create BatchRun record (Status = Running)
  ├── Load all active customers
  └── For each customer:
        ├── Load active RewardPeriod
        ├── Load active TriggerDefinitions (filtered by Frequency + scheduling logic)
        └── For each trigger:
              ├── IdempotencyGuard.Check(RewardPeriodId, TriggerDefinitionId, EventDate)
              │     └── If already exists → skip (Outcome = Skipped)
              ├── TriggerEvaluator.Evaluate(customer, trigger, batchWindow)
              │     ├── UrlTemplateResolver.Resolve(trigger.EndpointUrl, ...)
              │     ├── RestApiClient or SoapHttpClient.Call(...)
              │     ├── DynamicResponseResolver.Navigate(response, ...)
              │     ├── Handler.Evaluate(ruleParameters, resolvedData)
              │     │     └── WindowedAggregateHandler checks IsInterpolated → invalidates if true
              │     ├── Apply tier multiplier: SeedsAwarded = BaseSeeds × customer.CurrentTier.Multiplier
              │     └── Write SeedsLedger entry (Awarded | Skipped | Invalidated | Reversed)
              └── TierEvaluator.Evaluate(customer, rewardPeriod)
                    └── If TotalSeeds crosses threshold → upgrade CurrentTier (idempotent)

BatchRun updated (Status = Completed | Failed, CompletedAt set)
```

**Scheduling filter logic in BatchOrchestrator:**
- `Frequency = Daily` → evaluate every run
- `Frequency = Weekly` → evaluate every run (window is already weekly)
- `Frequency = Annual` → evaluate only if no `Awarded` ledger entry exists for this trigger in the current `RewardPeriod`
- `Frequency = OnceOff` → evaluate only if no `Awarded` ledger entry exists for this trigger across **all periods** for this customer (lifetime deduplication)

---

## 11. Rule Handler Specifications

### 11.1 BooleanFlag

Evaluates a single boolean field in the API response.

```json
{
  "field": "RenewalCommunicationOptIn",
  "operator": "==",
  "value": true
}
```

### 11.2 ValueComparison

Evaluates a field against a literal value using a comparison operator.

```json
{
  "field": "RemoteReadStatus",
  "operator": "==",
  "value": "Disabled"
}
```

Supported operators: `==`, `!=`, `>`, `>=`, `<`, `<=`

### 11.3 FieldComparison

Compares two fields from the same API response.

```json
{
  "fieldA": "CurrentYearGas",
  "operator": "<",
  "fieldB": "PriorYearGas"
}
```

### 11.4 WindowedAggregate (Harvest Hours)

Filters a list by time window, optionally invalidates on a condition, aggregates, then compares.

**ResponseMapping:**
```json
{
  "HourlyUsage": "array",
  "HourlyUsage.Hour": "string",
  "HourlyUsage.Consumption": "decimal",
  "HourlyUsage.Production": "decimal",
  "HourlyUsage.IsInterpolated": "bool"
}
```

**RuleParameters:**
```json
{
  "listField": "HourlyUsage",
  "filterField": "Hour",
  "windowStart": "12:00",
  "windowEnd": "17:00",
  "invalidateIf": {
    "field": "HourlyUsage.IsInterpolated",
    "operator": "==",
    "value": true
  },
  "aggregation": "Sum",
  "field": "HourlyUsage.Consumption",
  "operator": ">",
  "compareField": "HourlyUsage.Production"
}
```

`invalidateIf` causes the outcome to be recorded as `Invalidated` (not `Skipped`) — the attempt is visible in the ledger but no seeds are awarded.

---

## 12. Idempotency

The `IdempotencyGuard` checks the composite key `(RewardPeriodId, TriggerDefinitionId, EventDate)` before inserting any ledger entry. This makes batch reruns after failure safe — re-running Wednesday's batch on Thursday will not double-award seeds.

**OnceOff deduplication** is an additional check: the guard queries across **all** `RewardPeriod` records for the same `Customer.Id`, not just the current period. This prevents a signup bonus from being awarded again after a period reset.

---

## 13. Interpolation Guard

For any trigger with a `WindowedAggregate` rule type (or any trigger reading P4/hourly meter data), the handler checks `IsInterpolated` on each reading in the evaluation window. If **any** reading is interpolated:
- No seeds are awarded.
- The ledger entry is written with `Outcome = Invalidated` and `OutcomeDetail = "Data interpolated — actual meter read required"`.
- Customers with `RemoteReadEnabled = false` will consistently trigger this path for all P4-dependent triggers.

---

## 14. Key Implementation Flags

These must be resolved before or during build:

| # | Flag | Action required |
|---|---|---|
| 1 | `GratisStroomOptIn` ownership | Confirm which internal system owns this flag and how it syncs to `Customer` |
| 2 | `RemoteReadEnabled` ownership | Same — grid operator status; confirm sync mechanism |
| 3 | `AnalyticsOptIn` ownership | GDPR-relevant; confirm DPO sign-off and source system |
| 4 | Billing system `/close` call | Confirm the trigger mechanism — event-driven or polling? Must be reliable as it resets the period |
| 5 | Day-ahead tariff check trigger | Requires app event log; confirm MijnBudget emits screen-view events queryable by batch |
| 6 | `WindowedAggregateHandler` build order | Build and test this handler first (Harvest Hours) before activating other triggers — it is the most complex |
| 7 | Signup bonus trigger | `Frequency = OnceOff`, `BaseSeedsValue = 1000` (TBC). Fires on first `RewardPeriod` creation only |
| 8 | Contract activation → RewardPeriod | Confirm onboarding flow creates a `RewardPeriod` immediately on contract activation for all contract types |
| 9 | Churn grace period | `SeedsPreservedUntil` must be set on the churn event; returning customer flow must read this before creating a new period |
| 10 | Tier alternative routes | "Year 2+ with any engagement" and "5+ years" routes require a tenure query at `TierEvaluator` time — not just seed threshold |
| 11 | Seeds cap enforcement | Cap (10,000) should be enforced at `TriggerEvaluator` level: if `TotalSeeds + SeedsAwarded > cap`, clamp to cap and record `OutcomeDetail` accordingly |
| 12 | Concurrent batch safety | If multiple batch instances can run (Kubernetes restart scenario), the `IdempotencyGuard` insert should use a DB-level unique constraint on `(RewardPeriodId, TriggerDefinitionId, EventDate)` |

---

## 15. Out of Scope (v1)

The following are explicitly out of hackathon scope and will be designed separately:

- Monetary value of Seeds (redemption rate)
- Rewards catalogue (what Seeds can be redeemed for)
- Admin UI for trigger management
- Push notification integration (Harvest Hours alerts)
- ENTSO-E / day-ahead price feed integration (needed for future Harvest Hours expansion beyond gratis stroom window)
- Seasonal challenges and newsletter engagement triggers
- Customer-facing self-service seed dispute flow

---

## 16. Risks (from Concept 2)

| Risk | Mitigation |
|---|---|
| Seed liability ('fake money') | Annual reset + planned expiry policy (e.g. 3 years) + phased reward rollout |
| Fraudulent accumulation | Idempotency guard + interpolation guard + anomaly detection (post-v1) |
| Unequal access | Ensure enough universal triggers (app, opt-ins, clean year, referrals) to keep the programme fair for customers without solar/smart meter/dynamic contract |
| Seeds feeling low-value | Redemption design phase must set a compelling value proposition; Octopus Energy benchmarks at ~17% of annual energy costs |
| KCC complexity | Internal reference guide required at launch; ledger `OutcomeDetail` field feeds customer-facing explanation |
| Dormant customer awakening | Be cautious about proactive communications tied to loyalty tracking surfacing passive customers |

---

*RootedRewards | Budget Thuis Hackathon 2026 | spec_v1.md*

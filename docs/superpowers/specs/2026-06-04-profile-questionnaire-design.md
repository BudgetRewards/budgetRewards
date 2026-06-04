# Profile personalization questionnaire — design

**Date:** 2026-06-04
**Status:** Approved (pending implementation plan)

## Goal

Add a 5-section personalization questionnaire to the profile screen (`ProfileSheet`) so the
loyalty programme can tailor rewards/offers. Mirrors the existing "More about you"
(`MoreAboutYou`) section: collapsible-free inline section, persists to the profile, and grants
a one-time seed reward on save.

> **Note (Budget Thuis AI Usage Guidelines):** this collects customer personal data
> (preferences, attitudes). Before shipping to real users it requires a DPIA by the DPO
> (ana.badea@budgetthuis.nl). Building the UI in this prototype is fine.

## Scope

5 sections, all rendered in `ProfileSheet` under a new "Questionnaire" section after
"More about you":

1. **Hobbies** — choose top 3 (multi-select, rolling cap 3)
2. **Sustainability** — single choice
3. **Reward preferences** — choose top 3 (multi-select, rolling cap 3)
4. **Internet usage** — choose top 3 (multi-select, rolling cap 3)
5. **Enthusiasm** — single choice

## Behaviour

- **Top-3 (soft/rolling):** when 3 are already selected and the user picks a 4th, the
  earliest pick (`value[0]`) is removed and the new one appended. Toggling an already-selected
  option removes it.
- **Single choice:** reuses the existing `RadioGroup`.
- **Save:** a single **Save** button writes the answers (already live via `setProfile` on each
  change) and sets `questionnaireCompleted: true`. On the first completion only, awards
  **+10 seeds** via `claimNotification('Vragenlijst ingevuld' / 'Questionnaire completed',
  'App & Data', 10)`. A completion card appears afterward (same pattern as `MoreAboutYou`).
- **Bilingual:** full nl + en copy, driven by the language toggle like every other section.

## Data model

Stored on the `LangContext` profile object (persisted to `localStorage` `rr-profile` by
`setProfile`). These are loose extra fields — like the other `MoreAboutYou` fields they are
**not** part of the typed store `Profile` in `types.ts`, so no type change is needed.

| Field | Type | Values (language-independent ids) |
| --- | --- | --- |
| `hobbies` | `string[]` (≤3) | `movies, gaming, sport, reading, cooking, travel, social, diy` |
| `sustainability` | `string` | `very, fairly, neutral, not` |
| `rewardPrefs` | `string[]` (≤3) | `cashback, experiences, streaming, shopping, sustainable, donation, upgrades, earlyaccess` |
| `internetUse` | `string[]` (≤3) | `streaming, videocalls, wfh, gaming, social, news, banking` |
| `enthusiasm` | `string` | `super, interested, nice, considering` |
| `questionnaireCompleted` | `boolean` | gates the one-time reward |

Defaults: arrays default to `[]`, single-choice to `''`/`undefined`, `questionnaireCompleted`
to `false`. `DEFAULT_PROFILE` in `i18n.jsx` gains `hobbies: [], rewardPrefs: [], internetUse: []`
so reads are always arrays.

## Components (in `ProfileSheet.jsx`)

### `CheckboxGroup({ options, value, max = 3, onChange })`

Presentational, props-only (no hooks) so it is unit-testable. Renders each option as a toggle
pill styled like the existing `RadioGroup` buttons (green border/tint when selected, with a
check indicator instead of a radio dot). `value` is the array of selected ids.

Toggle logic:
- already selected → remove it.
- not selected and `value.length < max` → append.
- not selected and `value.length === max` → drop `value[0]`, append the new id (rolling).

Shows a small header hint with the max + current count (e.g. "Kies max. 3 · 2/3").

### `Questionnaire({ profile, setProfile })`

Mirrors `MoreAboutYou`:
- reads copy from `t.profile.questionnaire`.
- `update(key, value)` → `setProfile(prev => ({ ...prev, [key]: value }))`.
- 5 sections: `CheckboxGroup` for hobbies/rewardPrefs/internetUse, `RadioGroup` for
  sustainability/enthusiasm, each under a `SectionLabel` + question line.
- `handleSave()`: if `!profile.questionnaireCompleted`, award `QUESTIONNAIRE_SEEDS = 10` via
  `claimNotification`, then set `questionnaireCompleted: true`. Completion card when done.

### Placement in `ProfileSheet`

After the existing "More about you" block:
```jsx
<SectionLabel>{p.questionnaireSection}</SectionLabel>
<Questionnaire profile={profile} setProfile={setProfile}/>
```

## i18n (`i18n.jsx`, both `nl` and `en`)

New `t.profile.questionnaire` block. Section titles, question lines, and option labels. The
sustainability and enthusiasm options keep their leading emoji from the source content; the
three top-3 lists are plain text.

**Section titles / questions**

| key | nl | en |
| --- | --- | --- |
| `hobbies.title` | Wat je graag doet | What you enjoy |
| `hobbies.q` | Selecteer je top 3 hobby's | Select your top 3 hobbies |
| `sustainability.title` | Duurzaamheid | Sustainability |
| `sustainability.q` | Hoe belangrijk is duurzaamheid voor jou? | How important is sustainability to you? |
| `rewards.title` | Hoe je beloond wilt worden | How you want to be rewarded |
| `rewards.q` | Wat spreekt jou aan? | What appeals to you? |
| `internet.title` | Internet & online leven | Internet & online life |
| `internet.q` | Hoe gebruik je internet het meest? | How do you use the internet most? |
| `enthusiasm.title` | Wat je ervan vindt | What you think |
| `enthusiasm.q` | Hoe enthousiast ben je over Rooted Rewards? | How excited are you about Rooted Rewards? |

**Shared strings**

| key | nl | en |
| --- | --- | --- |
| `subtitle` | Help ons je beter te leren kennen voor de beste beloningen. Duurt ~2 minuten. | Help us get to know you for the best rewards. Takes ~2 minutes. |
| `maxHint` | `(n) => `Kies max. 3 · ${n}/3`` | `(n) => `Choose max. 3 · ${n}/3`` |
| `save` | Opslaan | Save |
| `doneTitle` | Vragenlijst ingevuld | Questionnaire completed |
| `seedsEarned` | `(n) => `+${n} seeds verdiend`` | `(n) => `+${n} seeds earned`` |

**Options** (`value` id → nl / en label)

*hobbies:* movies "Kijken naar films & series"/"Watching films & series" · gaming "Gamen"/"Gaming" ·
sport "Sport & fitness"/"Sport & fitness" · reading "Lezen & podcasts"/"Reading & podcasts" ·
cooking "Koken & recepten"/"Cooking & recipes" · travel "Reizen & avonturen"/"Travel & adventures" ·
social "Socializen & events"/"Socialising & events" · diy "DIY & klussen"/"DIY & home projects"

*sustainability:* very "🌱 Erg belangrijk, ik let erop"/"🌱 Very important, I pay attention to it" ·
fairly "🌍 Best belangrijk, waar mogelijk"/"🌍 Fairly important, where possible" ·
neutral "⚖️ Neutraal, maakt niet veel uit"/"⚖️ Neutral, doesn't matter much" ·
not "💭 Niet mijn prioriteit"/"💭 Not my priority"

*rewards:* cashback "Korting op mijn rekening (cashback)"/"Discount on my bill (cashback)" ·
experiences "Ervaringen (dinners, events, toegangen)"/"Experiences (dinners, events, access)" ·
streaming "Gratis streaming/apps (Netflix, Spotify, etc)"/"Free streaming/apps (Netflix, Spotify, etc)" ·
shopping "Kortingen op winkelen"/"Shopping discounts" ·
sustainable "Duurzame producten/diensten"/"Sustainable products/services" ·
donation "Donatie aan goed doel namens mij"/"Donation to charity on my behalf" ·
upgrades "Gratis upgrades (sneller internet, meer data)"/"Free upgrades (faster internet, more data)" ·
earlyaccess "Exclusieve early access (eerste naar nieuwe aanbiedingen)"/"Exclusive early access (first to new offers)"

*internet:* streaming "Video streamen (Netflix, YouTube, etc)"/"Streaming video (Netflix, YouTube, etc)" ·
videocalls "Veel videobellen (Teams, WhatsApp, Zoom)"/"Lots of video calls (Teams, WhatsApp, Zoom)" ·
wfh "Thuis werken/studeren"/"Working/studying from home" ·
gaming "Online gamen"/"Online gaming" ·
social "Social media & content creëren"/"Social media & creating content" ·
news "Nieuws & informatie"/"News & information" ·
banking "Online bankieren & winkelen"/"Online banking & shopping"

*enthusiasm:* super "🚀 Super enthousiast, vertel me alles!"/"🚀 Super excited, tell me everything!" ·
interested "👍 Interessant, graag meer info"/"👍 Interesting, I'd like more info" ·
nice "😌 Leuk meegenomen"/"😌 Nice bonus" ·
considering "🤔 Even bekijken"/"🤔 Just taking a look"

Plus a `p.questionnaireSection` section-label string: "Vragenlijst" / "Questionnaire".

## Files touched

| File | Change |
| --- | --- |
| `src/app/i18n.jsx` | add `t.profile.questionnaire` block + `questionnaireSection` label (nl + en); extend `DEFAULT_PROFILE` with `hobbies/rewardPrefs/internetUse: []` |
| `src/app/ProfileSheet.jsx` | add `CheckboxGroup` + `Questionnaire` components; render the new section |
| `src/app/__tests__/Questionnaire.test.jsx` (new) | unit tests for `CheckboxGroup` rolling cap + single-choice + completion flag |

## Testing

Component tests (presentational, props-driven where possible):
- `CheckboxGroup`: selecting within cap adds; toggling a selected id removes; selecting a 4th
  when 3 are chosen drops the oldest (`value[0]`) and appends the new (rolling), length stays 3.
- `RadioGroup` single-choice already covered by existing usage; add one assertion that picking
  an option calls `onChange` with the value.
- `Questionnaire` save: clicking Save sets `questionnaireCompleted` true and (first time only)
  invokes the reward callback once.

## Out of scope (YAGNI)

- No required-field validation / "you must answer all" gating — partial answers save fine.
- No analytics/segmentation logic consuming the answers (collection only).
- No change to the typed store `Profile` or the reducer.
- No re-reward on re-save.

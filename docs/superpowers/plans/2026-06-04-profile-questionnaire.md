# Profile Questionnaire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 5-section personalization questionnaire to the profile screen, persisting answers to the profile and granting a one-time +10 seed reward on save.

**Architecture:** A new `Questionnaire` sub-component in `ProfileSheet.jsx` mirrors the existing `MoreAboutYou` pattern (reads `t.profile.questionnaire`, writes via `setProfile`, one-time reward via `useTrigger().claimNotification`). Two single-choice sections reuse the existing `RadioGroup`; three "top-3" sections use a new presentational `CheckboxGroup` with a soft rolling cap (selecting a 4th drops the oldest). All copy is bilingual via `i18n.jsx`.

**Tech Stack:** React 19 + JSX, Vitest + jsdom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-06-04-profile-questionnaire-design.md`

---

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `src/app/i18n.jsx` | Copy + profile defaults | add `t.profile.questionnaire` block + `questionnaireSection` label (nl + en); add array defaults to `DEFAULT_PROFILE` |
| `src/app/ProfileSheet.jsx` | Profile UI | add `CheckboxGroup` + `Questionnaire` components (exported for tests); render new section |
| `src/app/__tests__/Questionnaire.test.jsx` (new) | Tests | `CheckboxGroup` rolling cap, `RadioGroup` onChange, `Questionnaire` save flow |

---

## Task 1: i18n copy + profile defaults

**Files:**
- Modify: `src/app/i18n.jsx`

- [ ] **Step 1: Add the Dutch questionnaire block**

In `src/app/i18n.jsx`, inside the `nl` locale's `profile` object, the `more: { ... }` block ends with:

```js
        yearLabel: 'Jaar', selectYear: 'Kies een jaar',
      },
    },
```

The first `},` closes `more`, the second closes `profile`. Insert the questionnaire copy **between** them (after the `more` block's closing `},`, before the `profile` closing `},`):

```js
      },
      questionnaireSection: 'Vragenlijst',
      questionnaire: {
        subtitle: 'Help ons je beter te leren kennen voor de beste beloningen. Duurt ~2 minuten.',
        maxHint: n => `Kies max. 3 · ${n}/3`,
        save: 'Opslaan',
        doneTitle: 'Vragenlijst ingevuld',
        seedsEarned: n => `+${n} seeds verdiend`,
        hobbies: {
          title: 'Wat je graag doet',
          q: "Selecteer je top 3 hobby's",
          options: [
            { value:'movies',  label:'Kijken naar films & series' },
            { value:'gaming',  label:'Gamen' },
            { value:'sport',   label:'Sport & fitness' },
            { value:'reading', label:'Lezen & podcasts' },
            { value:'cooking', label:'Koken & recepten' },
            { value:'travel',  label:'Reizen & avonturen' },
            { value:'social',  label:'Socializen & events' },
            { value:'diy',     label:'DIY & klussen' },
          ],
        },
        sustainability: {
          title: 'Duurzaamheid',
          q: 'Hoe belangrijk is duurzaamheid voor jou?',
          options: [
            { value:'very',    label:'🌱 Erg belangrijk, ik let erop' },
            { value:'fairly',  label:'🌍 Best belangrijk, waar mogelijk' },
            { value:'neutral', label:'⚖️ Neutraal, maakt niet veel uit' },
            { value:'not',     label:'💭 Niet mijn prioriteit' },
          ],
        },
        rewards: {
          title: 'Hoe je beloond wilt worden',
          q: 'Wat spreekt jou aan?',
          options: [
            { value:'cashback',    label:'Korting op mijn rekening (cashback)' },
            { value:'experiences', label:'Ervaringen (dinners, events, toegangen)' },
            { value:'streaming',   label:'Gratis streaming/apps (Netflix, Spotify, etc)' },
            { value:'shopping',    label:'Kortingen op winkelen' },
            { value:'sustainable', label:'Duurzame producten/diensten' },
            { value:'donation',    label:'Donatie aan goed doel namens mij' },
            { value:'upgrades',    label:'Gratis upgrades (sneller internet, meer data)' },
            { value:'earlyaccess', label:'Exclusieve early access (eerste naar nieuwe aanbiedingen)' },
          ],
        },
        internet: {
          title: 'Internet & online leven',
          q: 'Hoe gebruik je internet het meest?',
          options: [
            { value:'streaming',  label:'Video streamen (Netflix, YouTube, etc)' },
            { value:'videocalls', label:'Veel videobellen (Teams, WhatsApp, Zoom)' },
            { value:'wfh',        label:'Thuis werken/studeren' },
            { value:'gaming',     label:'Online gamen' },
            { value:'social',     label:'Social media & content creëren' },
            { value:'news',       label:'Nieuws & informatie' },
            { value:'banking',    label:'Online bankieren & winkelen' },
          ],
        },
        enthusiasm: {
          title: 'Wat je ervan vindt',
          q: 'Hoe enthousiast ben je over Rooted Rewards?',
          options: [
            { value:'super',       label:'🚀 Super enthousiast, vertel me alles!' },
            { value:'interested',  label:'👍 Interessant, graag meer info' },
            { value:'nice',        label:'😌 Leuk meegenomen' },
            { value:'considering', label:'🤔 Even bekijken' },
          ],
        },
      },
    },
```

- [ ] **Step 2: Add the English questionnaire block**

In `src/app/i18n.jsx`, inside the `en` locale's `profile` object, the `more` block also ends with `yearLabel: 'Year', selectYear: 'Select year',` then `},` (closes `more`) then `},` (closes `profile`). Insert between them:

```js
      },
      questionnaireSection: 'Questionnaire',
      questionnaire: {
        subtitle: 'Help us get to know you for the best rewards. Takes ~2 minutes.',
        maxHint: n => `Choose max. 3 · ${n}/3`,
        save: 'Save',
        doneTitle: 'Questionnaire completed',
        seedsEarned: n => `+${n} seeds earned`,
        hobbies: {
          title: 'What you enjoy',
          q: 'Select your top 3 hobbies',
          options: [
            { value:'movies',  label:'Watching films & series' },
            { value:'gaming',  label:'Gaming' },
            { value:'sport',   label:'Sport & fitness' },
            { value:'reading', label:'Reading & podcasts' },
            { value:'cooking', label:'Cooking & recipes' },
            { value:'travel',  label:'Travel & adventures' },
            { value:'social',  label:'Socialising & events' },
            { value:'diy',     label:'DIY & home projects' },
          ],
        },
        sustainability: {
          title: 'Sustainability',
          q: 'How important is sustainability to you?',
          options: [
            { value:'very',    label:'🌱 Very important, I pay attention to it' },
            { value:'fairly',  label:'🌍 Fairly important, where possible' },
            { value:'neutral', label:"⚖️ Neutral, doesn't matter much" },
            { value:'not',     label:'💭 Not my priority' },
          ],
        },
        rewards: {
          title: 'How you want to be rewarded',
          q: 'What appeals to you?',
          options: [
            { value:'cashback',    label:'Discount on my bill (cashback)' },
            { value:'experiences', label:'Experiences (dinners, events, access)' },
            { value:'streaming',   label:'Free streaming/apps (Netflix, Spotify, etc)' },
            { value:'shopping',    label:'Shopping discounts' },
            { value:'sustainable', label:'Sustainable products/services' },
            { value:'donation',    label:'Donation to charity on my behalf' },
            { value:'upgrades',    label:'Free upgrades (faster internet, more data)' },
            { value:'earlyaccess', label:'Exclusive early access (first to new offers)' },
          ],
        },
        internet: {
          title: 'Internet & online life',
          q: 'How do you use the internet most?',
          options: [
            { value:'streaming',  label:'Streaming video (Netflix, YouTube, etc)' },
            { value:'videocalls', label:'Lots of video calls (Teams, WhatsApp, Zoom)' },
            { value:'wfh',        label:'Working/studying from home' },
            { value:'gaming',     label:'Online gaming' },
            { value:'social',     label:'Social media & creating content' },
            { value:'news',       label:'News & information' },
            { value:'banking',    label:'Online banking & shopping' },
          ],
        },
        enthusiasm: {
          title: 'What you think',
          q: 'How excited are you about Rooted Rewards?',
          options: [
            { value:'super',       label:'🚀 Super excited, tell me everything!' },
            { value:'interested',  label:"👍 Interesting, I'd like more info" },
            { value:'nice',        label:'😌 Nice bonus' },
            { value:'considering', label:'🤔 Just taking a look' },
          ],
        },
      },
    },
```

- [ ] **Step 3: Add array defaults to DEFAULT_PROFILE**

In `src/app/i18n.jsx`, `DEFAULT_PROFILE` currently ends:

```js
  evType: null, evCharging: null,
  moreCompleted: false,
}
```

Change to add the questionnaire array defaults (so reads are always arrays) and the completion flag:

```js
  evType: null, evCharging: null,
  moreCompleted: false,
  hobbies: [], rewardPrefs: [], internetUse: [],
  sustainability: '', enthusiasm: '',
  questionnaireCompleted: false,
}
```

- [ ] **Step 4: Type-check**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/i18n.jsx
git commit -m "feat: add questionnaire copy (nl + en) and profile defaults"
```

---

## Task 2: CheckboxGroup component + tests

A presentational multi-select with a soft rolling cap. Props only — no hooks — so it is trivially testable.

**Files:**
- Modify: `src/app/ProfileSheet.jsx`
- Test: `src/app/__tests__/Questionnaire.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/app/__tests__/Questionnaire.test.jsx`:

```jsx
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckboxGroup, RadioGroup } from '../ProfileSheet.jsx'

const OPTS = [
  { value: 'a', label: 'A' }, { value: 'b', label: 'B' },
  { value: 'c', label: 'C' }, { value: 'd', label: 'D' },
]

describe('CheckboxGroup (rolling top-3)', () => {
  test('adds a value when under the cap', () => {
    const onChange = vi.fn()
    render(<CheckboxGroup options={OPTS} value={['a']} max={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('B'))
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
  })

  test('removes a value when toggling a selected option', () => {
    const onChange = vi.fn()
    render(<CheckboxGroup options={OPTS} value={['a', 'b']} max={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('A'))
    expect(onChange).toHaveBeenCalledWith(['b'])
  })

  test('rolling: selecting a 4th drops the oldest and keeps length 3', () => {
    const onChange = vi.fn()
    render(<CheckboxGroup options={OPTS} value={['a', 'b', 'c']} max={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('D'))
    expect(onChange).toHaveBeenCalledWith(['b', 'c', 'd'])
  })
})

describe('RadioGroup', () => {
  test('calls onChange with the picked value', () => {
    const onChange = vi.fn()
    render(<RadioGroup options={OPTS} value="a" onChange={onChange} />)
    fireEvent.click(screen.getByText('C'))
    expect(onChange).toHaveBeenCalledWith('c')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/app/__tests__/Questionnaire.test.jsx`
Expected: FAIL — `CheckboxGroup` is not exported (import error), so the suite cannot run.

- [ ] **Step 3: Export RadioGroup and add CheckboxGroup**

In `src/app/ProfileSheet.jsx`, the existing `RadioGroup` is declared `function RadioGroup(...)`. Add `export` to it:

```jsx
export function RadioGroup({ options, value, onChange }) {
```

Then, directly after the `RadioGroup` function (before `NumberInput`), add the new component:

```jsx
export function CheckboxGroup({ options, value, max = 3, onChange }) {
  function toggle(v) {
    if (value.includes(v)) {
      onChange(value.filter(x => x !== v))
    } else if (value.length < max) {
      onChange([...value, v])
    } else {
      // Soft cap: drop the oldest pick and append the new one (rolling top-N).
      onChange([...value.slice(1), v])
    }
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {options.map(opt => {
        const on = value.includes(opt.value)
        return (
          <button key={opt.value} type="button" onClick={() => toggle(opt.value)} style={{
            border: on ? '2px solid var(--green)' : '1.5px solid var(--grey-line)',
            borderRadius:12, padding:'11px 14px', background: on ? 'rgba(0,166,81,0.07)' : '#fff',
            fontFamily:'inherit', fontWeight:700, fontSize:13.5, cursor:'pointer',
            color: on ? 'var(--green)' : 'var(--navy)', transition:'all .15s',
            textAlign:'left', display:'flex', alignItems:'center', gap:10,
          }}>
            <span style={{
              width:18, height:18, borderRadius:6, flexShrink:0,
              border: on ? '2px solid var(--green)' : '2px solid var(--grey-line)',
              background: on ? 'var(--green)' : '#fff', transition:'all .15s',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {on && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/app/__tests__/Questionnaire.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/ProfileSheet.jsx src/app/__tests__/Questionnaire.test.jsx
git commit -m "feat: add CheckboxGroup with rolling top-3 cap"
```

---

## Task 3: Questionnaire component + wire into ProfileSheet

**Files:**
- Modify: `src/app/ProfileSheet.jsx`
- Test: `src/app/__tests__/Questionnaire.test.jsx`

- [ ] **Step 1: Write the failing test**

In `src/app/__tests__/Questionnaire.test.jsx`, add the import at the top (extend the existing import line from `../ProfileSheet.jsx` to include `Questionnaire`):

```jsx
import { CheckboxGroup, RadioGroup, Questionnaire } from '../ProfileSheet.jsx'
```

Add these imports below the existing ones:

```jsx
import React from 'react'
import { RRProvider } from '../store/RRContext.tsx'
import { LanguageProvider, useLang } from '../i18n.jsx'
```

Then append this describe block:

```jsx
describe('Questionnaire save flow', () => {
  function Host() {
    const { profile, setProfile } = useLang()
    return <Questionnaire profile={profile} setProfile={setProfile} />
  }

  test('clicking Save shows the completion card', () => {
    render(
      <RRProvider>
        <LanguageProvider>
          <Host />
        </LanguageProvider>
      </RRProvider>
    )
    // Completion card not shown before saving.
    expect(screen.queryByText(/Vragenlijst ingevuld|Questionnaire completed/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Opslaan|Save/ }))
    expect(screen.getByText(/Vragenlijst ingevuld|Questionnaire completed/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/app/__tests__/Questionnaire.test.jsx`
Expected: FAIL — `Questionnaire` is not exported yet (import error).

- [ ] **Step 3: Add the Questionnaire component**

In `src/app/ProfileSheet.jsx`, directly after the `MoreAboutYou` function (before `/* ─── main sheet ─── */`), add:

```jsx
const QUESTIONNAIRE_SEEDS = 10

export function Questionnaire({ profile, setProfile }) {
  const t = useT()
  const q = t.profile.questionnaire
  const { claimNotification } = useTrigger()

  function update(key, value) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const wasCompleted = profile.questionnaireCompleted
    setProfile(prev => ({ ...prev, questionnaireCompleted: true }))
    if (!wasCompleted) {
      claimNotification('Vragenlijst ingevuld', 'Questionnaire completed', 'App & Data', QUESTIONNAIRE_SEEDS)
    }
  }

  const multiSection = (section, key) => (
    <>
      <SectionLabel>{section.title}</SectionLabel>
      <p style={{ fontSize:13, color:'var(--navy)', fontWeight:600, margin:'0 0 4px' }}>{section.q}</p>
      <p style={{ fontSize:11, color:'var(--navy-60)', fontWeight:600, margin:'0 0 10px' }}>
        {q.maxHint((profile[key] || []).length)}
      </p>
      <CheckboxGroup options={section.options} value={profile[key] || []} max={3}
        onChange={v => update(key, v)}/>
    </>
  )

  const singleSection = (section, key) => (
    <>
      <SectionLabel>{section.title}</SectionLabel>
      <p style={{ fontSize:13, color:'var(--navy)', fontWeight:600, margin:'0 0 10px' }}>{section.q}</p>
      <RadioGroup options={section.options} value={profile[key]} onChange={v => update(key, v)}/>
    </>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <p style={{ fontSize:13, color:'var(--navy-60)', lineHeight:1.5, margin:'0 0 6px' }}>{q.subtitle}</p>

      {multiSection(q.hobbies, 'hobbies')}
      {singleSection(q.sustainability, 'sustainability')}
      {multiSection(q.rewards, 'rewardPrefs')}
      {multiSection(q.internet, 'internetUse')}
      {singleSection(q.enthusiasm, 'enthusiasm')}

      <button onClick={handleSave} style={{
        marginTop:20, border:'none', borderRadius:14, padding:'14px',
        background:'var(--green)', color:'#fff',
        fontFamily:'inherit', fontWeight:800, fontSize:14, letterSpacing:0.4,
        cursor:'pointer', boxShadow:'0 6px 16px rgba(0,166,81,0.28)',
      }}>
        {q.save}
      </button>

      {profile.questionnaireCompleted && (
        <div style={{ marginTop:14, background:'rgba(0,166,81,0.08)', borderRadius:14,
          padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>✅</span>
          <div>
            <div style={{ fontWeight:800, fontSize:13.5, color:'var(--navy)' }}>{q.doneTitle}</div>
            <div style={{ fontSize:12.5, color:'var(--green)', fontWeight:700, marginTop:2 }}>
              {q.seedsEarned(QUESTIONNAIRE_SEEDS)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Render the section in ProfileSheet**

In `src/app/ProfileSheet.jsx`, the scrollable content ends with the "More about you" block:

```jsx
          {/* ── More about you ── */}
          <SectionLabel>{p.moreSection}</SectionLabel>
          <MoreAboutYou profile={profile} setProfile={setProfile}/>

        </div>
```

Add the questionnaire section right after `<MoreAboutYou .../>`:

```jsx
          {/* ── More about you ── */}
          <SectionLabel>{p.moreSection}</SectionLabel>
          <MoreAboutYou profile={profile} setProfile={setProfile}/>

          {/* ── Questionnaire ── */}
          <SectionLabel>{p.questionnaireSection}</SectionLabel>
          <Questionnaire profile={profile} setProfile={setProfile}/>

        </div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:run -- src/app/__tests__/Questionnaire.test.jsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/ProfileSheet.jsx src/app/__tests__/Questionnaire.test.jsx
git commit -m "feat: add personalization questionnaire to profile screen"
```

---

## Task 4: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm run test:run`
Expected: PASS — all suites including the new Questionnaire tests.

- [ ] **Step 2: Build + lint**

Run: `npm run build` then `npm run lint`
Expected: `build` PASS. `lint` reports only the 2 pre-existing `src/app/store/RRContext.tsx` `react-refresh/only-export-components` errors (present on main, unrelated). No new errors in `ProfileSheet.jsx` or `i18n.jsx`.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open the app, complete onboarding, open the profile sheet (tap the greeting on the home screen), scroll to the new "Vragenlijst / Questionnaire" section.
Expected: all 5 sections render; the three top-3 lists cap at 3 with the oldest dropping when a 4th is picked; single-choice sections select one; **Save** shows the completion card and the balance increases by 10 the first time only; switching language (profile → Taal/Language) translates the questionnaire.

---

## Self-Review notes

- **Spec coverage:** data model + defaults (Task 1 Step 3), bilingual copy (Task 1), `CheckboxGroup` rolling cap (Task 2), `Questionnaire` with RadioGroup reuse + one-time +10 reward + completion card (Task 3), placement after "More about you" (Task 3 Step 4), tests for rolling cap / single-choice / save flow (Tasks 2–3), verification incl. reward-once + i18n (Task 4). All covered.
- **Type consistency:** profile keys `hobbies`, `rewardPrefs`, `internetUse`, `sustainability`, `enthusiasm`, `questionnaireCompleted` match between `DEFAULT_PROFILE` (Task 1), the `Questionnaire` reads/writes (Task 3), and the spec table. `CheckboxGroup` / `RadioGroup` / `Questionnaire` are the exported names used in tests.
- **No placeholders:** every step shows complete code/commands.

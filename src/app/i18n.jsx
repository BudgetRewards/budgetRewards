import React from 'react'

const T = {
  nl: {
    fmt: n => n.toLocaleString('nl-NL'),
    tabs: {
      home: 'Home', history: 'Historie', earn: 'Verdienen', tiers: 'Tiers', harvest: 'Oogsturen', usage: 'Verbruik',
    },
    dashboard: {
      greeting: h => h >= 6 && h < 12 ? 'Goedemorgen,' : h >= 12 && h < 18 ? 'Goedemiddag,' : h >= 18 && h < 23 ? 'Goedenavond,' : 'Goedenacht,',
      balance: 'Jouw seeds-saldo',
      currentTier: 'Huidige tier',
      to: 'Naar',
      seedsToGo: 'seeds te gaan',
      seeds: 'seeds',
      period: 'Periode',
      multiplier: 'Multiplier actief',
      harvestDays: 'Oogstdagen verdiend',
      daysLeft: 'Dagen in periode',
      earnMore: 'Verdien meer seeds',
      actionsAvailable: n => `${n} acties beschikbaar om te claimen`,
      recentActivity: 'Recente activiteit',
      seeAll: 'Alles →',
    },
    ledger: {
      eyebrow: 'Seeds-grootboek',
      title: 'Historie',
      totalEarned: 'Totaal verdiend',
      penalties: 'Gemiste oogst',
      all: 'Alles',
      earned: 'Verdiend',
      penaltiesFilter: 'Gemist',
      empty: 'Geen transacties in deze categorie.',
      footnote: 'Multiplier wordt toegepast op het moment van verdienen — op basis van je tier op dat moment.',
    },
    catalogue: {
      eyebrow: 'Catalogus',
      title: 'Verdienen',
      actionsReady: n => `${n} acties klaar om te claimen`,
      tierNote: 'Elke seed telt 1,5× mee in jouw Boom-tier',
    },
    tiers: {
      eyebrow: 'Levenslange status',
      title: 'Tiers',
      nog: n => `nog ${n} seeds`,
      seedsLabel: n => `${n} seeds`,
      multiplier: 'multiplier',
      qualify: 'Zo kwalificeer je',
      currentBadge: '★ Jouw huidige tier',
      neverDown: 'Tiers gaan nooit omlaag',
      neverDownDesc: 'Eenmaal bereikt, behoud je je tier levenslang — ook als je seeds-saldo daalt. Je status is voor altijd van jou.',
    },
    harvest: {
      eyebrow: 'Apr – sep · in het weekend',
      title: 'Oogsturen',
      heroTitle: 'Verdien seeds in het zonne-uur',
      heroDesc: 'Heb je Stroom van Budget Thuis? Simuleer dan een weekenddag op de Verbruik-tab en verdien +10 seeds per dag.',
      enrolled: 'Aangemeld: gratis stroom',
      needElectricity: 'Activeer Stroom om mee te doen',
      participatingNote: 'Je doet mee. Simuleer een weekenddag op de Verbruik-tab — elke dag levert +10 seeds op.',
      missedNote: 'Zonder Stroom worden weekenddagen als gemiste oogst geregistreerd. Activeer Stroom om +10 per dag te verdienen.',
      daysEarned: 'Oogstdagen verdiend',
      seasonSeeds: 'Seeds dit seizoen',
      legendEarned: 'Verdiend',
      legendMissed: 'Gemist',
      legendUpcoming: 'Aankomend',
      legendSimulated: 'Verbruik gesimuleerd',
      waysTitle: 'Zo werkt het',
      enrolledTitle: 'Oogstdag verdiend',
      enrolledDesc: 'Elke weekenddag dat je Stroom hebt en je verbruik simuleert',
      notEnrolledTitle: 'Geen Stroom = gemiste oogst',
      notEnrolledDesc: 'Zonder Stroom tellen weekenddagen niet mee — ze worden geregistreerd als gemiste oogst.',
      perDay: 'per dag',
      requirements: 'Vereisten',
      req1: 'Stroom actief bij Budget Thuis',
      req2: 'Verbruik gesimuleerd op een weekenddag',
      months: ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'],
      weekdays: ['ma','di','wo','do','vr','za','zo'],
    },
    usage: {
      eyebrow: 'Vandaag · 24 uur',
      title: 'Verbruik',
      consumption: 'Verbruik',
      production: 'Opwek',
      totalConsumption: 'Totaal verbruik',
      totalProduction: 'Totaal opwek',
      net: 'Netto afname',
      kwh: 'kWh',
      hourly: 'Per uur',
      regenerate: 'Nieuwe simulatie',
      hint: 'Gesimuleerde data — elke vernieuwing genereert nieuwe willekeurige waarden per uur.',
      peakConsumption: 'Piek verbruik',
      peakProduction: 'Piek opwek',
      at: h => `om ${String(h).padStart(2, '0')}:00`,
      homeBattery: 'Thuisbatterij',
      homeBatteryDesc: 'Opwek rond de klok i.p.v. alleen overdag',
      dateLabel: 'Simulatiedag',
      dateHint: 'Kies een dag tot en met vandaag',
    },
    toast: {
      delivered: n => `${n} seeds geleverd!`,
      weekendEarned: w => `Oogstdag ${w} verdiend`,
      tapToView: 'Tik om je historie te bekijken',
    },
  },
  en: {
    fmt: n => n.toLocaleString('en-US'),
    tabs: {
      home: 'Home', history: 'History', earn: 'Earn', tiers: 'Tiers', harvest: 'Harvest', usage: 'Usage',
    },
    dashboard: {
      greeting: h => h >= 6 && h < 12 ? 'Good morning,' : h >= 12 && h < 18 ? 'Good afternoon,' : h >= 18 && h < 23 ? 'Good evening,' : 'Good night,',
      balance: 'Your seeds balance',
      currentTier: 'Current tier',
      to: 'To',
      seedsToGo: 'seeds to go',
      seeds: 'seeds',
      period: 'Period',
      multiplier: 'Multiplier active',
      harvestDays: 'Harvest days earned',
      daysLeft: 'Days in period',
      earnMore: 'Earn more seeds',
      actionsAvailable: n => `${n} actions available to claim`,
      recentActivity: 'Recent activity',
      seeAll: 'All →',
    },
    ledger: {
      eyebrow: 'Seeds ledger',
      title: 'History',
      totalEarned: 'Total earned',
      penalties: 'Missed Harvest',
      all: 'All',
      earned: 'Earned',
      penaltiesFilter: 'Missed',
      empty: 'No transactions in this category.',
      footnote: 'Multiplier is applied at the time of earning — based on your tier at that moment.',
    },
    catalogue: {
      eyebrow: 'Catalogue',
      title: 'Earn',
      actionsReady: n => `${n} actions ready to claim`,
      tierNote: 'Every seed counts 1.5× in your Tree tier',
    },
    tiers: {
      eyebrow: 'Lifetime status',
      title: 'Tiers',
      nog: n => `${n} seeds to go`,
      seedsLabel: n => `${n} seeds`,
      multiplier: 'multiplier',
      qualify: 'How to qualify',
      currentBadge: '★ Your current tier',
      neverDown: 'Tiers never go down',
      neverDownDesc: 'Once reached, you keep your tier for life — even if your seeds balance drops. Your status is yours forever.',
    },
    harvest: {
      eyebrow: 'Apr – Sep · on weekends',
      title: 'Harvest Hours',
      heroTitle: 'Earn seeds in the solar hour',
      heroDesc: 'Have Electricity from Budget Thuis? Simulate a weekend day on the Usage tab and earn +10 seeds per day.',
      enrolled: 'Enrolled: free electricity',
      needElectricity: 'Activate Electricity to take part',
      participatingNote: 'You’re taking part. Simulate a weekend day on the Usage tab — each day earns +10 seeds.',
      missedNote: 'Without Electricity, weekend days are logged as missed harvest. Activate Electricity to earn +10 per day.',
      daysEarned: 'Harvest days earned',
      seasonSeeds: 'Seeds this season',
      legendEarned: 'Earned',
      legendMissed: 'Missed',
      legendUpcoming: 'Upcoming',
      legendSimulated: 'Usage simulated',
      waysTitle: 'How it works',
      enrolledTitle: 'Harvest day earned',
      enrolledDesc: 'Every weekend day you have Electricity and simulate your usage',
      notEnrolledTitle: 'No Electricity = missed harvest',
      notEnrolledDesc: 'Without Electricity, weekend days don’t count — they’re logged as missed harvest.',
      perDay: 'per day',
      requirements: 'Requirements',
      req1: 'Electricity active with Budget Thuis',
      req2: 'Usage simulated on a weekend day',
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      weekdays: ['Mo','Tu','We','Th','Fr','Sa','Su'],
    },
    usage: {
      eyebrow: 'Today · 24 hours',
      title: 'Usage',
      consumption: 'Consumption',
      production: 'Production',
      totalConsumption: 'Total consumption',
      totalProduction: 'Total production',
      net: 'Net consumption',
      kwh: 'kWh',
      hourly: 'Per hour',
      regenerate: 'New simulation',
      hint: 'Simulated data — each refresh generates new random values per hour.',
      peakConsumption: 'Peak consumption',
      peakProduction: 'Peak production',
      at: h => `at ${String(h).padStart(2, '0')}:00`,
      homeBattery: 'Home battery',
      homeBatteryDesc: 'Production around the clock instead of daytime only',
      dateLabel: 'Simulation day',
      dateHint: 'Pick a day up to and including today',
    },
    toast: {
      delivered: n => `${n} seeds delivered!`,
      weekendEarned: w => `Harvest day ${w} earned`,
      tapToView: 'Tap to view your history',
    },
  },
}

// Profile captured during onboarding (Step 3 + product picker).
const DEFAULT_PROFILE = {
  solarPanels: false, homeBattery: false, householdSize: 1, customerYears: 0, products: [],
}

function readProfile() {
  try {
    const raw = localStorage.getItem('rr-profile')
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    /* ignore corrupt storage */
  }
  return DEFAULT_PROFILE
}

const LangContext = React.createContext({
  lang: 'nl', set: () => {}, userName: '', setUserName: () => {},
  profile: DEFAULT_PROFILE, setProfile: () => {},
})

export function LanguageProvider({ children }) {
  const [lang, setLang] = React.useState(() => localStorage.getItem('rr-lang') || 'nl')
  const [userName, setUserNameState] = React.useState(() => localStorage.getItem('rr-name') || '')
  const [profile, setProfileState] = React.useState(readProfile)
  const set = l => { setLang(l); localStorage.setItem('rr-lang', l) }
  const setUserName = n => { setUserNameState(n); localStorage.setItem('rr-name', n) }
  const setProfile = p => { setProfileState(p); localStorage.setItem('rr-profile', JSON.stringify(p)) }
  return (
    <LangContext.Provider value={{ lang, set, userName, setUserName, profile, setProfile }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return React.useContext(LangContext)
}

/** Onboarding profile (solarPanels, homeBattery, householdSize, customerYears, products). */
export function useProfile() {
  return React.useContext(LangContext).profile
}

export function useT() {
  const { lang } = useLang()
  return T[lang]
}

export function useFmt() {
  const { lang } = useLang()
  return T[lang].fmt
}

export function tName(obj, lang) {
  return lang === 'en' ? (obj.nameEn ?? obj.name) : obj.name
}

export function tCat(obj, lang) {
  return lang === 'en' ? (obj.catEn ?? obj.cat) : obj.cat
}

export function tNeed(obj, lang) {
  return lang === 'en' ? (obj.needEn ?? obj.need) : obj.need
}

export function tRoutes(tier, lang) {
  return lang === 'en' ? (tier.routesEn ?? tier.routes) : tier.routes
}

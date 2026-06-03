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
      penalties: 'Boetes',
      all: 'Alles',
      earned: 'Verdiend',
      penaltiesFilter: 'Boetes',
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
      eyebrow: 'Apr – sep · weekends 12:00–17:00',
      title: 'Oogsturen',
      heroTitle: 'Verdien seeds in het zonne-uur',
      heroDesc: 'In het weekend tussen 12:00 en 17:00 (apr–sep) is er vaak een stroomoverschot. Verbruik of verschuif dan, en oogst seeds.',
      enrolled: 'Aangemeld: gratis stroom',
      daysEarned: 'Oogstdagen verdiend',
      seasonSeeds: 'Seeds dit seizoen',
      legendEarned: 'Verdiend',
      legendMissed: 'Gemist',
      legendUpcoming: 'Aankomend',
      legendSimulated: 'Verbruik gesimuleerd',
      waysTitle: 'Twee manieren om te oogsten',
      enrolledTitle: 'Aangemeld: gratis stroom',
      enrolledDesc: 'Verbruik in het venster — stroom is gratis',
      notEnrolledTitle: 'Niet aangemeld: verschuiven',
      notEnrolledDesc: 'Verschuif verbruik naar het venster',
      requirements: 'Vereisten',
      req1: 'Zonnepanelen geregistreerd',
      req2: 'Slimme meter met werkelijke standen (niet geschat)',
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
  },
  en: {
    fmt: n => n.toLocaleString('en-US'),
    tabs: {
      home: 'Home', history: 'History', earn: 'Earn', tiers: 'Tiers', harvest: 'Harvest', usage: 'Usage',
    },
    dashboard: {
      greeting: h => h >= 6 && h < 12 ? 'Good morning,' : h >= 12 && h < 18 ? 'Good afternoon,' : h >= 18 && h < 23 ? 'Good evening,' : 'Good night,',
      balance: 'Your seeds balance',
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
      penalties: 'Penalties',
      all: 'All',
      earned: 'Earned',
      penaltiesFilter: 'Penalties',
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
      eyebrow: 'Apr – Sep · weekends 12:00–17:00',
      title: 'Harvest Hours',
      heroTitle: 'Earn seeds in the solar hour',
      heroDesc: 'On weekends between 12:00 and 17:00 (Apr–Sep) there is often a surplus of solar energy. Consume or shift then, and harvest seeds.',
      enrolled: 'Enrolled: free electricity',
      daysEarned: 'Harvest days earned',
      seasonSeeds: 'Seeds this season',
      legendEarned: 'Earned',
      legendMissed: 'Missed',
      legendUpcoming: 'Upcoming',
      legendSimulated: 'Usage simulated',
      waysTitle: 'Two ways to harvest',
      enrolledTitle: 'Enrolled: free electricity',
      enrolledDesc: 'Consume in the window — electricity is free',
      notEnrolledTitle: 'Not enrolled: shift',
      notEnrolledDesc: 'Shift consumption to the window',
      requirements: 'Requirements',
      req1: 'Solar panels registered',
      req2: 'Smart meter with actual readings (not estimated)',
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
  },
}

const LangContext = React.createContext({ lang: 'nl', set: () => {}, userName: '', setUserName: () => {} })

export function LanguageProvider({ children }) {
  const [lang, setLang] = React.useState(() => localStorage.getItem('rr-lang') || 'nl')
  const [userName, setUserNameState] = React.useState(() => localStorage.getItem('rr-name') || '')
  const set = l => { setLang(l); localStorage.setItem('rr-lang', l) }
  const setUserName = n => { setUserNameState(n); localStorage.setItem('rr-name', n) }
  return <LangContext.Provider value={{ lang, set, userName, setUserName }}>{children}</LangContext.Provider>
}

export function useLang() {
  return React.useContext(LangContext)
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

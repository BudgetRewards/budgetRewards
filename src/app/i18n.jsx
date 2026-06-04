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
      notEnrolledTitle: 'Verschuif naar het venster',
      notEnrolledDesc: 'Iedereen doet mee — verdien seeds als je beide weekenddagen groene uren haalt (meer verbruik dan opwek).',
      perWeekend: 'per weekend',
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
    toast: {
      delivered: n => `${n} seeds geleverd!`,
      weekendEarned: w => `Oogstweekend ${w} — beide dagen verdiend`,
      tapToView: 'Tik om je historie te bekijken',
    },
    renewal: {
      eyebrow: 'Verlenging beschikbaar',
      elec: 'Verleng je stroomcontract',
      internet: 'Verleng je internetcontract',
      desc: n => `Verleng nu en ontvang ${n} seeds.`,
      cta: 'Verleng nu',
      popupTitle: 'Contract verlengd! 🎉',
      popupDesc: n => `Je hebt ${n} seeds ontvangen voor je verlenging.`,
      close: 'Top!',
    },
    profile: {
      title: 'Profiel',
      personalSection: 'Persoonlijk',
      nameLabel: 'Naam', namePlaceholder: 'Jouw naam',
      langLabel: 'Taal',
      productsSection: 'Jouw producten',
      homeSection: 'Jouw situatie',
      solarLabel: 'Zonnepanelen',
      batteryLabel: 'Thuisbatterij',
      householdLabel: 'Personen in huis',
      yearsLabel: 'Klant bij Budget Thuis',
      yes: 'Ja', no: 'Nee',
      yearUnit: n => n === 0 ? 'Nieuw klant' : n === 1 ? '1 jaar' : `${n} jaar`,
      personUnit: n => n === 6 ? '6+' : `${n}`,
      moreSection: 'Meer over jou',
      moreComing: 'Meer vragen komen binnenkort.',
      more: {
        title: 'Jouw thuis in kaart',
        subtitle: 'Vul in wat er bij jou thuis staat. Zo kunnen we je beter helpen — en jij verdient er zaden mee.',
        yes: 'Ja', no: 'Nee',
        battery: {
          section: 'Stroom opslaan',
          question: 'Heb je een thuisbatterij?',
          kwhLabel: 'Hoeveel kWh kan je batterij opslaan?',
          kwhPlaceholder: 'bijv. 5, 10',
          sinceLabel: 'Sinds wanneer heb je hem?',
        },
        solar: {
          section: 'Zonnepanelen',
          question: 'Heb je zonnepanelen?',
          countLabel: 'Hoeveel panelen heb je?',
          countPlaceholder: 'bijv. 8',
          sinceLabel: 'Sinds wanneer?',
          wpLabel: 'Weet je hoeveel Wattpiek (Wp) je installatie heeft? (optioneel)',
          wpHint: 'Veel mensen weten dit niet',
          wpPlaceholder: 'bijv. 3000',
        },
        heating: {
          section: 'Warmte',
          question: 'Hoe verwarm je je huis?',
          options: [
            { value:'gas',      label:'CV-ketel op gas'  },
            { value:'heatpump', label:'Warmtepomp'       },
            { value:'district', label:'Stadsverwarming'  },
            { value:'other',    label:'Anders'           },
          ],
          heatpumpSinceLabel: 'Sinds wanneer heb je een warmtepomp?',
        },
        car: {
          section: 'Auto',
          question: 'Rijd je in een elektrische auto?',
          options: [
            { value:'full',   label:'Ja, volledig elektrisch' },
            { value:'hybrid', label:'Ja, hybride'             },
            { value:'none',   label:'Nee'                     },
          ],
          chargingQuestion: 'Laad je thuis op?',
          chargingOptions: [
            { value:'post',   label:'Ja, met een laadpaal'           },
            { value:'socket', label:'Ja, via een gewoon stopcontact' },
            { value:'none',   label:'Nee'                            },
          ],
        },
        closing: {
          title: 'Bedankt — je profiel is bijgewerkt.',
          seedsEarned: n => `Je hebt ${n} zaden verdiend.`,
          save: 'Opslaan',
        },
        yearLabel: 'Jaar', selectYear: 'Kies een jaar',
      },
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
      notEnrolledTitle: 'Shift to the window',
      notEnrolledDesc: 'Everyone takes part — earn seeds when both weekend days hit green hours (more usage than production).',
      perWeekend: 'per weekend',
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
    toast: {
      delivered: n => `${n} seeds delivered!`,
      weekendEarned: w => `Harvest weekend ${w} — both days earned`,
      tapToView: 'Tap to view your history',
    },
    renewal: {
      eyebrow: 'Renewal available',
      elec: 'Renew your electricity contract',
      internet: 'Renew your internet contract',
      desc: n => `Renew now and earn ${n} seeds.`,
      cta: 'Renew now',
      popupTitle: 'Contract renewed! 🎉',
      popupDesc: n => `You received ${n} seeds for your renewal.`,
      close: 'Great!',
    },
    profile: {
      title: 'Profile',
      personalSection: 'Personal',
      nameLabel: 'Name', namePlaceholder: 'Your name',
      langLabel: 'Language',
      productsSection: 'Your products',
      homeSection: 'Your situation',
      solarLabel: 'Solar panels',
      batteryLabel: 'Home battery',
      householdLabel: 'People in household',
      yearsLabel: 'Customer at Budget Thuis',
      yes: 'Yes', no: 'No',
      yearUnit: n => n === 0 ? 'New customer' : n === 1 ? '1 year' : `${n} years`,
      personUnit: n => n === 6 ? '6+' : `${n}`,
      moreSection: 'More about you',
      moreComing: 'More questions coming soon.',
      more: {
        title: 'Your home in detail',
        subtitle: "Fill in what's in your home. This helps us serve you better — and you earn seeds for it.",
        yes: 'Yes', no: 'No',
        battery: {
          section: 'Home battery',
          question: 'Do you have a home battery?',
          kwhLabel: 'How many kWh can your battery store?',
          kwhPlaceholder: 'e.g. 5, 10',
          sinceLabel: 'Since when do you have it?',
        },
        solar: {
          section: 'Solar panels',
          question: 'Do you have solar panels?',
          countLabel: 'How many panels do you have?',
          countPlaceholder: 'e.g. 8',
          sinceLabel: 'Since when?',
          wpLabel: 'Peak Watt (Wp) of your installation? (optional)',
          wpHint: "Many people don't know this",
          wpPlaceholder: 'e.g. 3000',
        },
        heating: {
          section: 'Heating',
          question: 'How do you heat your home?',
          options: [
            { value:'gas',      label:'Gas boiler'       },
            { value:'heatpump', label:'Heat pump'        },
            { value:'district', label:'District heating' },
            { value:'other',    label:'Other'            },
          ],
          heatpumpSinceLabel: 'Since when do you have a heat pump?',
        },
        car: {
          section: 'Car',
          question: 'Do you drive an electric car?',
          options: [
            { value:'full',   label:'Yes, fully electric' },
            { value:'hybrid', label:'Yes, hybrid'         },
            { value:'none',   label:'No'                  },
          ],
          chargingQuestion: 'Do you charge at home?',
          chargingOptions: [
            { value:'post',   label:'Yes, with a charging post'   },
            { value:'socket', label:'Yes, via a regular socket'   },
            { value:'none',   label:'No'                          },
          ],
        },
        closing: {
          title: 'Thank you — your profile is up to date.',
          seedsEarned: n => `You earned ${n} seeds.`,
          save: 'Save',
        },
        yearLabel: 'Year', selectYear: 'Select year',
      },
    },
  },
}

// Profile captured during onboarding (Step 3 + product picker).
const DEFAULT_PROFILE = {
  solarPanels: false, homeBattery: false, householdSize: 1, customerYears: 0, products: [],
  batteryKwh: '', batterySince: null,
  solarCount: '', solarSince: null, solarWp: '',
  heatingType: null, heatpumpSince: null,
  evType: null, evCharging: null,
  moreCompleted: false,
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

/* ───────────────── RootedRewards · mock data ───────────────── */
const RR = {
  user: { name: 'Jan', fullName: 'Jan de Vries' },
  balance: 2600,
  cap: 10000,
  multiplier: 1.5,
  period: { startLabel: '1 jan 2026', endLabel: '31 dec 2026', daysLeft: 211 },

  tiers: [
    { id:'seed', emoji:'🌱', name:'Zaad', nameEn:'Seed', en:'Seed', min:0, max:2499, mult:'1×',
      routes:['Standaard startpunt voor elk lid'],
      routesEn:['Standard starting point for every member'] },
    { id:'tree', emoji:'🌳', name:'Boom', nameEn:'Tree', en:'Tree', min:2500, max:5999, mult:'1,5×',
      routes:['2.500 seeds verzameld','of 12 maanden actief klant'],
      routesEn:['2,500 seeds collected','or 12 months as an active customer'] },
    { id:'forest', emoji:'🌲', name:'Bos', nameEn:'Forest', en:'Forest', min:6000, max:null, mult:'2×',
      routes:['6.000 seeds verzameld','of 2+ producten + zonnepanelen','of 36 maanden actief klant'],
      routesEn:['6,000 seeds collected','or 2+ products + solar panels','or 36 months as an active customer'] },
  ],
  currentTier: 'tree',
  nextTier: { name:'Bos', nameEn:'Forest', threshold:6000 },

  ledger: [
    { id:1, name:'Harvest Hours — zaterdag', nameEn:'Harvest Hours — Saturday',   cat:'Harvest Hours', catEn:'Harvest Hours', date:'31 mei 2026', base:10, mult:1.5, amount:15,   kind:'pos' },
    { id:2, name:'Remote uitlezing uitgezet', nameEn:'Remote reading disabled',    cat:'Energiegedrag', catEn:'Energy behaviour', date:'24 mei 2026', base:-60, mult:1.5, amount:-90, kind:'neg' },
    { id:3, name:'Harvest Hours — zondag',    nameEn:'Harvest Hours — Sunday',     cat:'Harvest Hours', catEn:'Harvest Hours', date:'18 mei 2026', base:10, mult:1.5, amount:15,   kind:'pos' },
    { id:4, name:'Maandelijkse meterstand',   nameEn:'Monthly meter reading',      cat:'App & Data',    catEn:'App & Data', date:'1 mei 2026',  base:20, mult:1.5, amount:30,   kind:'pos' },
    { id:5, name:'Tweede product: Internet',  nameEn:'Second product: Internet',   cat:'Multi-product', catEn:'Multi-product', date:'12 apr 2026', base:500, mult:1, amount:500,  kind:'pos' },
    { id:6, name:'Boom-niveau bereikt',         nameEn:'Tree level reached',          cat:'Lifecycle',     catEn:'Lifecycle', date:'12 apr 2026', base:250, mult:1, amount:250,  kind:'pos' },
    { id:7, name:'Slimme thermostaat gekoppeld', nameEn:'Smart thermostat connected', cat:'Energiegedrag', catEn:'Energy behaviour', date:'28 mrt 2026', base:200, mult:1, amount:200, kind:'pos' },
    { id:8, name:'App geactiveerd',           nameEn:'App activated',              cat:'App & Data',    catEn:'App & Data', date:'3 mrt 2026',  base:150, mult:1, amount:150,  kind:'pos' },
    { id:9, name:'Welkomstbonus',             nameEn:'Welcome bonus',              cat:'Lifecycle',     catEn:'Lifecycle', date:'1 jan 2026',  base:1000, mult:1, amount:1000, kind:'pos' },
  ],

  catalogue: [
    { cat:'Contract & Lifecycle', catEn:'Contract & Lifecycle', items:[
      { name:'Welkomstbonus',              nameEn:'Welcome bonus',           seeds:1000, status:'claimed' },
      { name:'Boom-niveau bereikt',          nameEn:'Tree level reached',       seeds:250,  status:'claimed' },
      { name:'Contract verlengd (1 jaar)', nameEn:'Contract renewed (1 year)', seeds:400, status:'available' },
      { name:'5 jaar trouw lid',           nameEn:'5 years loyal member',    seeds:1500, status:'locked',
        need:'Word lid voor 5 jaar — nog 4 jaar te gaan',
        needEn:'Become a member for 5 years — 4 years to go' },
    ]},
    { cat:'App & Data', catEn:'App & Data', items:[
      { name:'App geactiveerd',         nameEn:'App activated',              seeds:150, status:'claimed' },
      { name:'Maandelijkse meterstand', nameEn:'Monthly meter reading',      seeds:20,  status:'available' },
      { name:'Pushmeldingen aangezet',  nameEn:'Push notifications enabled', seeds:50,  status:'available' },
    ]},
    { cat:'Harvest Hours', catEn:'Harvest Hours', items:[
      { name:'Oogstdag — gratis stroom', nameEn:'Harvest day — free electricity', seeds:10,  status:'claimed' },
      { name:'Oogstdag — verschuiving',  nameEn:'Harvest day — shift',            seeds:20,  status:'available' },
      { name:'Volledig oogstseizoen',    nameEn:'Full harvest season',            seeds:300, status:'locked',
        need:'Verzamel oogstdagen het hele seizoen (apr–sep)',
        needEn:'Collect harvest days throughout the season (Apr–Sep)' },
    ]},
    { cat:'Energiegedrag', catEn:'Energy behaviour', items:[
      { name:'Slimme thermostaat gekoppeld', nameEn:'Smart thermostat connected', seeds:200, status:'claimed' },
      { name:'Verbruik onder gemiddelde',    nameEn:'Consumption below average',  seeds:120, status:'available' },
      { name:'Remote uitlezing uitgezet',    nameEn:'Remote reading disabled',    seeds:-60, status:'penalty',
        need:'Boete: zet remote uitlezing weer aan om dit te voorkomen',
        needEn:'Penalty: re-enable remote reading to avoid this' },
    ]},
    { cat:'Multi-product', catEn:'Multi-product', items:[
      { name:'Tweede product: Internet',    nameEn:'Second product: Internet',  seeds:500, status:'claimed' },
      { name:'Derde product: Verzekering',  nameEn:'Third product: Insurance',  seeds:750, status:'locked',
        need:'Voeg een derde Budget Thuis-product toe',
        needEn:'Add a third Budget Thuis product' },
      { name:'Zonnepanelen geregistreerd',  nameEn:'Solar panels registered',   seeds:600, status:'available' },
    ]},
  ],

  // Harvest season — months Apr(3) … Sep(8), 2026. Today = 3 jun 2026.
  harvestSeason: { year:2026, months:[3,4,5,6,7,8], todayMonth:5, todayDate:3 },
};

/* Build harvest calendar (single source of truth for totals) */
(function buildHarvest(){
  const year = 2026;
  const months = [3,4,5,6,7,8]; // Apr … Sep
  const today = new Date(2026, 5, 3);
  const missed = new Set(['3-25','4-3','4-17']); // a few missed weekend days
  const SEEDS_PER_DAY = 10, MULT = 1.5;

  const monthsData = months.map(m=>{
    const first = new Date(year, m, 1);
    const totalDays = new Date(year, m+1, 0).getDate();
    const lead = (first.getDay()+6)%7; // Monday-first grid
    const cells = [];
    for(let i=0;i<lead;i++) cells.push(null);
    for(let d=1; d<=totalDays; d++){
      const date = new Date(year, m, d);
      const dow = date.getDay();
      const weekend = dow===0 || dow===6;
      let state = 'none';
      if(weekend){
        if(date < today) state = missed.has(`${m}-${d}`) ? 'missed' : 'earned';
        else state = 'upcoming';
      }
      cells.push({ d, weekend, state, today: date.getTime()===today.getTime() });
    }
    return { m, cells };
  });

  let earned = 0;
  monthsData.forEach(mo=>mo.cells.forEach(c=>{ if(c && c.state==='earned') earned++; }));

  RR.harvest = {
    optedIn: true,
    daysEarned: earned,
    seasonSeeds: Math.round(earned * SEEDS_PER_DAY * MULT),
    seedsPerDay: SEEDS_PER_DAY,
    year, months, monthsData,
  };
})();

export default RR;

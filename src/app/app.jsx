import React from 'react'
import { IOSDevice } from './ios-frame.jsx'
import { Icon } from './ui.jsx'
import { Dashboard } from './screens/dashboard.jsx'
import { Ledger } from './screens/ledger.jsx'
import { Catalogue } from './screens/catalogue.jsx'
import { Tiers } from './screens/tiers.jsx'
import { Harvest } from './screens/harvest.jsx'
import { Usage } from './screens/usage.jsx'
import { LanguageProvider, useT, useLang } from './i18n.jsx'
import { OnboardingModal } from './OnboardingModal.jsx'

/* ───────────────── RootedRewards · App shell + tab bar ───────────────── */
const TABS = [
  { id:'home',    icon:'home' },
  { id:'history', icon:'ledger' },
  { id:'earn',    icon:'earn' },
  { id:'tiers',   icon:'tiers' },
  { id:'harvest', icon:'harvest' },
  { id:'usage',   icon:'bolt' },
];

function TabBar({ active, onChange }){
  const t = useT();
  return (
    <div className="rr-tabbar">
      {TABS.map(tab=>{
        const on = active===tab.id;
        return (
          <button key={tab.id} className={'rr-tab'+(on?' active':'')} onClick={()=>onChange(tab.id)}>
            <Icon name={tab.icon} size={24} stroke="currentColor" sw={on?2.3:2}
              fill={on && (tab.id==='home') ? 'rgba(0,166,81,0.12)' : 'none'}/>
            <span className="lbl">{t.tabs[tab.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

function App(){
  const [tab, setTab] = React.useState(()=> localStorage.getItem('rr-tab') || 'home');
  const scrollRef = React.useRef(null);
  const { lang, set, userName } = useLang();

  const go = (id)=>{ setTab(id); localStorage.setItem('rr-tab', id);
    if(scrollRef.current) scrollRef.current.scrollTop = 0; };

  React.useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);

  const screens = {
    home:    <Dashboard onNav={go}/>,
    history: <Ledger/>,
    earn:    <Catalogue/>,
    tiers:   <Tiers/>,
    harvest: <Harvest/>,
    usage:   <Usage/>,
  };

  return (
    <div className="rr rr-app">
      {!userName && <OnboardingModal/>}
      <button className="rr-lang-toggle" onClick={() => set(lang === 'nl' ? 'en' : 'nl')}>
        {lang === 'nl' ? 'EN' : 'NL'}
      </button>
      <div className="rr-scroll" ref={scrollRef}>
        <div key={tab}>{screens[tab]}</div>
      </div>
      <TabBar active={tab} onChange={go}/>
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

function Root(){
  const isMobile = useIsMobile();
  if (isMobile) return <LanguageProvider><App/></LanguageProvider>;
  return (
    <LanguageProvider>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'#E8E9EC', padding:'24px 0' }}>
        <IOSDevice>
          <App/>
        </IOSDevice>
      </div>
    </LanguageProvider>
  );
}

export { Root };

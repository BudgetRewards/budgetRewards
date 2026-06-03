import React from 'react'
import { IOSDevice } from './ios-frame.jsx'
import { Icon } from './ui.jsx'
import { Dashboard } from './screens/dashboard.jsx'
import { Ledger } from './screens/ledger.jsx'
import { Catalogue } from './screens/catalogue.jsx'
import { Tiers } from './screens/tiers.jsx'
import { Harvest } from './screens/harvest.jsx'

/* ───────────────── RootedRewards · App shell + tab bar ───────────────── */
const TABS = [
  { id:'home',    label:'Home',      icon:'home' },
  { id:'history', label:'Historie',  icon:'ledger' },
  { id:'earn',    label:'Verdienen', icon:'earn' },
  { id:'tiers',   label:'Tiers',     icon:'tiers' },
  { id:'harvest', label:'Oogsturen', icon:'harvest' },
];

function TabBar({ active, onChange }){
  return (
    <div className="rr-tabbar">
      {TABS.map(t=>{
        const on = active===t.id;
        return (
          <button key={t.id} className={'rr-tab'+(on?' active':'')} onClick={()=>onChange(t.id)}>
            <Icon name={t.icon} size={24} stroke="currentColor" sw={on?2.3:2}
              fill={on && (t.id==='home') ? 'rgba(0,166,81,0.12)' : 'none'}/>
            <span className="lbl">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function App(){
  const [tab, setTab] = React.useState(()=> localStorage.getItem('rr-tab') || 'home');
  const scrollRef = React.useRef(null);

  const go = (id)=>{ setTab(id); localStorage.setItem('rr-tab', id);
    if(scrollRef.current) scrollRef.current.scrollTop = 0; };

  React.useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);

  const screens = {
    home:    <Dashboard onNav={go}/>,
    history: <Ledger/>,
    earn:    <Catalogue/>,
    tiers:   <Tiers/>,
    harvest: <Harvest/>,
  };

  return (
    <div className="rr rr-app">
      <div className="rr-scroll" ref={scrollRef}>
        <div key={tab}>{screens[tab]}</div>
      </div>
      <TabBar active={tab} onChange={go}/>
    </div>
  );
}

function Root(){
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#E8E9EC', padding:'24px 0' }}>
      <IOSDevice>
        <App/>
      </IOSDevice>
    </div>
  );
}

export { Root };

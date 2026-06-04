import React from 'react'
import { IOSDevice } from './ios-frame.jsx'
import { Icon, SeedMark } from './ui.jsx'
import { Dashboard } from './screens/dashboard.jsx'
import { Ledger } from './screens/ledger.jsx'
import { Catalogue } from './screens/catalogue.jsx'
import { Tiers } from './screens/tiers.jsx'
import { Harvest } from './screens/harvest.jsx'
import { Usage } from './screens/usage.jsx'
import { LanguageProvider, useT, useLang } from './i18n.jsx'
import { OnboardingModal } from './OnboardingModal.jsx'
import { ProfileSheet } from './ProfileSheet.jsx'
import { NotificationQueue } from './NotificationQueue.jsx'
import { TierUpCelebration } from './TierUpCelebration.jsx'
import { useRR, useTrigger } from './store/RRContext.tsx'

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
  const { historyUnseen } = useRR();
  return (
    <div className="rr-tabbar">
      {TABS.map(tab=>{
        const on = active===tab.id;
        const showDot = tab.id==='history' && historyUnseen;
        return (
          <button key={tab.id} className={'rr-tab'+(on?' active':'')} onClick={()=>onChange(tab.id)}>
            <span style={{ position:'relative', display:'inline-flex' }}>
              <Icon name={tab.icon} size={24} stroke="currentColor" sw={on?2.3:2}
                fill={on && (tab.id==='home') ? 'rgba(255,255,255,0.18)' : 'none'}/>
              {showDot && <span className="rr-tab-dot"/>}
            </span>
            <span className="lbl">{t.tabs[tab.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

function FullscreenHint() {
  const [visible, setVisible] = React.useState(
    () => !isStandalone() && window.matchMedia('(max-width: 767px)').matches
  );
  const [dismissed, setDismissed] = React.useState(
    () => !!localStorage.getItem('rr-fs-dismissed')
  );

  React.useEffect(() => {
    const hide = () => setVisible(false);
    document.addEventListener('fullscreenchange', hide);
    return () => document.removeEventListener('fullscreenchange', hide);
  }, []);

  if (!visible || dismissed) return null;

  function dismiss() {
    localStorage.setItem('rr-fs-dismissed', '1');
    setDismissed(true);
  }

  if (isIOS()) {
    return (
      <div style={{
        position:'absolute', bottom:80, left:14, right:14, zIndex:30,
        background:'rgba(0,0,0,0.72)', borderRadius:16, padding:'12px 14px',
        backdropFilter:'blur(10px)', display:'flex', alignItems:'center', gap:10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
          <path d="M12 2v13M7 7l5-5 5 5"/><path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>
        </svg>
        <span style={{flex:1, color:'#fff', fontSize:12, fontFamily:'inherit', fontWeight:600, lineHeight:1.4}}>
          Tap <b>Share</b> → <b>Add to Home Screen</b> for fullscreen
        </span>
        <button onClick={dismiss} style={{
          background:'none', border:'none', color:'rgba(255,255,255,0.6)',
          fontSize:18, cursor:'pointer', padding:'0 2px', lineHeight:1,
        }}>×</button>
      </div>
    );
  }

  function requestFs() {
    document.documentElement.requestFullscreen?.().then(() => setVisible(false)).catch(() => {});
  }

  return (
    <button onClick={requestFs} style={{
      position:'absolute', bottom:80, right:14, zIndex:30,
      background:'rgba(0,0,0,0.55)', border:'none', borderRadius:99,
      padding:'7px 13px', display:'flex', alignItems:'center', gap:6,
      color:'#fff', fontFamily:'inherit', fontWeight:700, fontSize:11,
      cursor:'pointer', backdropFilter:'blur(8px)',
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
      Fullscreen
    </button>
  );
}

/* Toast shown when a weekend reward lands. Auto-dismisses; tap to open history. */
function RewardToast({ onView }){
  const t = useT();
  const { lang } = useLang();
  const { pendingReward } = useRR();
  const { dismissReward } = useTrigger();

  React.useEffect(()=>{
    if(!pendingReward) return;
    const id = setTimeout(dismissReward, 4500);
    return ()=>clearTimeout(id);
  }, [pendingReward]);

  if(!pendingReward) return null;
  const label = lang==='en' ? pendingReward.weekendEn : pendingReward.weekend;
  return (
    <div className="rr-toast rr-fadein" role="status"
      onClick={()=>{ dismissReward(); onView(); }}>
      <SeedMark size={34} tone="onGreen"/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:13.5 }}>{t.toast.delivered(pendingReward.amount)}</div>
        <div style={{ fontSize:11.5, opacity:0.9 }}>{t.toast.weekendEarned(label)}</div>
      </div>
      <Icon name="arrow" size={18} stroke="#fff"/>
    </div>
  );
}

/* Popup shown after a contract renewal on the home screen. */
function RenewalPopup(){
  const t = useT();
  const { lang } = useLang();
  const { pendingRenewal } = useRR();
  const { dismissRenewal } = useTrigger();
  if(!pendingRenewal) return null;
  const r = t.renewal;
  const name = lang === 'en' ? pendingRenewal.nameEn : pendingRenewal.name;
  return (
    <div className="rr-onboarding-backdrop" onClick={dismissRenewal}>
      <div className="rr-onboarding-card rr" style={{ textAlign:'center', maxWidth:320 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:44, lineHeight:1, marginBottom:8 }}>🎉</div>
        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, letterSpacing:-0.3 }}>{r.popupTitle}</h2>
        <div className="rr-sub" style={{ fontSize:13, marginBottom:12 }}>{name}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <SeedMark size={28}/>
          <span style={{ fontSize:30, fontWeight:800, color:'var(--green)', letterSpacing:-0.5 }}>
            +{pendingRenewal.seeds}
          </span>
        </div>
        <div className="rr-sub" style={{ fontSize:12.5, marginBottom:18 }}>{r.popupDesc(pendingRenewal.seeds)}</div>
        <button onClick={dismissRenewal} style={{ width:'100%', border:'none', borderRadius:14, padding:'14px',
          background:'var(--green)', color:'#fff', fontFamily:'inherit', fontWeight:800, fontSize:14,
          cursor:'pointer', boxShadow:'0 6px 16px rgba(0,166,81,0.28)' }}>
          {r.close}
        </button>
      </div>
    </div>
  );
}

const pad2 = n => String(n).padStart(2, '0');

/* Once the customer is onboarded, simulate usage for every weekend day on the
   harvest calendar up to today (using their profile's home-battery setting).
   This populates the calendar and awards the weekends they earned. */
function AutoSimulateWeekends(){
  const { userName, profile } = useLang();
  const state = useRR();
  const { simulateUsage } = useTrigger();
  const doneRef = React.useRef(false);

  React.useEffect(()=>{
    if(!userName || doneRef.current) return;
    doneRef.current = true;
    const hs = state.harvestSeason;
    const today = `${hs.year}-${pad2(hs.todayMonth + 1)}-${pad2(hs.todayDate)}`;
    state.harvest.monthsData.forEach(mo=>{
      mo.cells.forEach(c=>{
        if(!c || !c.weekend) return;
        const iso = `${hs.year}-${pad2(mo.m + 1)}-${pad2(c.d)}`;
        if(iso <= today && !state.usages[iso]){
          simulateUsage({ date: iso, hasHomeBattery: profile.homeBattery });
        }
      });
    });
  }, [userName]);

  return null;
}

function App(){
  const [tab, setTab] = React.useState(()=> localStorage.getItem('rr-tab') || 'home');
  const [showProfile, setShowProfile] = React.useState(false);
  const scrollRef = React.useRef(null);
  const { userName } = useLang();
  const { markHistorySeen } = useTrigger();

  const go = (id)=>{ setTab(id); localStorage.setItem('rr-tab', id);
    if(scrollRef.current) scrollRef.current.scrollTop = 0; };

  React.useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);

  // Opening the history clears its "unseen" dot.
  React.useEffect(()=>{ if(tab==='history') markHistorySeen(); }, [tab]);

  const screens = {
    home:    <Dashboard onNav={go} onProfileOpen={() => setShowProfile(true)}/>,
    history: <Ledger/>,
    earn:    <Catalogue/>,
    tiers:   <Tiers/>,
    harvest: <Harvest/>,
    usage:   <Usage/>,
  };

  return (
    <div className="rr rr-app">
      {!userName && <OnboardingModal/>}
      <NotificationQueue/>
      <AutoSimulateWeekends/>
      <FullscreenHint/>
      <RewardToast onView={()=>go('history')}/>
      <TierUpCelebration/>
      <RenewalPopup/>
      <div className="rr-scroll" ref={scrollRef}>
        <div key={tab}>{screens[tab]}</div>
      </div>
      <TabBar active={tab} onChange={go}/>
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)}/>}
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

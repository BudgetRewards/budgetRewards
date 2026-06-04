import { useEffect, useRef, useState } from 'react'
import './ComingSoon.css'

const LAUNCH_DATE = new Date(import.meta.env.VITE_LAUNCH_DATE ?? '2026-06-09T14:00:00')

export default function ComingSoon() {
  const cdDRef = useRef<HTMLSpanElement>(null)
  const cdHRef = useRef<HTMLSpanElement>(null)
  const cdMRef = useRef<HTMLSpanElement>(null)
  const cdSRef = useRef<HTMLSpanElement>(null)
  const [email, setEmail] = useState('')
  const [signedUp, setSignedUp] = useState(false)

  useEffect(() => {
    const target = LAUNCH_DATE

    function pad(n: number) { return String(n).padStart(2, '0') }

    function tick() {
      const diff = Math.max(0, target.getTime() - Date.now())
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (cdDRef.current) cdDRef.current.textContent = pad(d)
      if (cdHRef.current) cdHRef.current.textContent = pad(h)
      if (cdMRef.current) cdMRef.current.textContent = pad(m)
      if (cdSRef.current) cdSRef.current.textContent = pad(s)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  function handleSignup() {
    if (email.includes('@')) setSignedUp(true)
  }

  return (
    <div className="coming-soon-root">
      <div className="bg-cross">+</div>
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>
      <div className="bg-circle bg-circle-3"></div>

      <div className="countdown-wrap">
        <div className="cd-timer-row">
          <div className="cd-block"><span className="cd-num" ref={cdDRef}>00</span><span className="cd-lbl">Days</span></div>
          <span className="cd-sep">:</span>
          <div className="cd-block"><span className="cd-num" ref={cdHRef}>00</span><span className="cd-lbl">Hrs</span></div>
          <span className="cd-sep">:</span>
          <div className="cd-block"><span className="cd-num" ref={cdMRef}>00</span><span className="cd-lbl">Min</span></div>
          <span className="cd-sep">:</span>
          <div className="cd-block"><span className="cd-num" ref={cdSRef}>00</span><span className="cd-lbl">Sec</span></div>
        </div>
        <div className="cd-label">Hackathon 2026</div>
      </div>

      <div className="shell">
        <nav className="nav">
          <div className="logo">
            <span className="logo-top">BUDGET</span>
            <span className="logo-bottom">REWARDS</span>
          </div>
        </nav>

        <div className="hero">
          <div className="coming-lockup">
            <span className="coming-word"><span>COMING</span></span>
            <span className="coming-word"><span>SOON</span></span>
          </div>

          <div className="program-name-row">
            <span className="program-name">BudgetRewards</span>
            <span className="program-pill">🌱 Loyalty Programme</span>
          </div>

          <div className="desc-row">
            <p className="tagline">
              Earn points. Grow your tier.{' '}
              <strong>Every action with Budget Thuis plants deeper roots</strong>{' '}
              — and puts money back on your invoice.
            </p>

            <div className="notify-block">
              <span className="notify-label">Get notified at launch</span>
              {signedUp ? (
                <p className="notify-confirm">You're on the list. 🌱</p>
              ) : (
                <div className="notify-input-row">
                  <input
                    className="notify-input"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSignup()}
                  />
                  <button className="notify-btn" onClick={handleSignup}>
                    Sign up
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 12 19 12" /><polyline points="13 6 19 12 13 18" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="stats-strip">
          <div className="stat-item">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <div className="stat-text-block">
              <span className="stat-val">Weekly</span>
              <span className="stat-lbl">Points calculated &amp; updated</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M9.5 16.5l-3-3 1.4-1.4 1.6 1.6 5.1-5.1 1.4 1.4z" /></svg>
            </div>
            <div className="stat-text-block">
              <span className="stat-val">Rewards</span>
              <span className="stat-lbl">Coming soon · stay tuned</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <div className="stat-text-block">
              <span className="stat-val">3 Tiers</span>
              <span className="stat-lbl">Zaadjes · Boom · Bos</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div className="stat-text-block">
              <span className="stat-val">0 pts</span>
              <span className="stat-lbl">Floor — discount never goes negative</span>
            </div>
          </div>
        </div>
      </div>

      <div className="team-credit">
        <span className="credit-from">from the</span>
        <span className="credit-name">Rewards Team 🌳</span>
      </div>
    </div>
  )
}

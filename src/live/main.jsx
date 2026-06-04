import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { LiveDisplay } from './LiveDisplay.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <LiveDisplay/>
    <Analytics/>
  </>
)

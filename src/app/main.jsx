import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { Root } from './app.jsx'
import { RRProvider } from './store/RRContext.tsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <RRProvider>
    <Root/>
    <Analytics/>
  </RRProvider>
)

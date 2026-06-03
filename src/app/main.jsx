import React from 'react'
import ReactDOM from 'react-dom/client'
import { Root } from './app.jsx'
import { RRProvider } from './store/RRContext.tsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <RRProvider>
    <Root/>
  </RRProvider>
)

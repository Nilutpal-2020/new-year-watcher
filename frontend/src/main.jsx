import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { Toaster } from 'sonner';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from '@vercel/analytics/react';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster theme="dark" />
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)

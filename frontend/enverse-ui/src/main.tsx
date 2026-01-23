import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // StrictMode removed to prevent double-mounting in development (was causing alerts to play twice)
  <App />
)
//main
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Removed the dark background div that was causing the black screen and layout glitches */}
    <App />
  </React.StrictMode>
)
//main
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen w-full bg-gray-950 text-gray-100">
      <App />
    </div>
  </React.StrictMode>
)

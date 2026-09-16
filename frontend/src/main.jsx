import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import AppContextProvider from './context/AppContext.jsx'

// ---- React App Mount ----
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// ---- Register Service Worker (Vite PWA Compatible) ----
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/service-worker.js', { scope: '/' })
//       .then(reg => {
//         console.log('✅ Service Worker registered:', reg)
//       })
//       .catch(err => {
//         console.error('❌ Service Worker failed:', err)
//       })
//   })
// }

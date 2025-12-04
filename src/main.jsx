import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AlertsProvider } from './context/AlertsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlertsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AlertsProvider>
  </StrictMode>,
)

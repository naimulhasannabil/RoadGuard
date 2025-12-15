

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AlertsProvider } from './context/AlertsContext'
import { NotificationProvider } from './context/NotificationContext'
import { GeoFenceProvider } from './context/GeoFenceContext'
import ErrorBoundary from './ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <NotificationProvider>
        <AlertsProvider>
          <GeoFenceProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </GeoFenceProvider>
        </AlertsProvider>
      </NotificationProvider>
    </ErrorBoundary>
  </StrictMode>,
)
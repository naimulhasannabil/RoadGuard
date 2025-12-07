import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AlertsProvider } from './context/AlertsContext'
import ErrorBoundary from './ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AlertsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AlertsProvider>
    </ErrorBoundary>
  </StrictMode>,
)

import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import MapPage from './pages/MapPage'
import ReportAlert from './pages/ReportAlert'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const [count, setCount] = useState(0)

  // Replace the sample Vite UI with our app layout and routes
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/report" element={<ReportAlert />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import MapPage from './pages/MapPage'
import ReportAlert from './pages/ReportAlert'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const location = useLocation()
  const hideNavbar = ['/login', '/signup'].includes(location.pathname)

  console.log('App rendering, location:', location.pathname)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/report" element={<ReportAlert />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App

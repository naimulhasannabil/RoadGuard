

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import NotificationToast from './components/NotificationToast'
import AlertNotificationListener from './components/AlertNotificationListener'
import MapPage from './pages/MapPage'
import ReportAlert from './pages/ReportAlert'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import Emergency from './pages/Emergency'
import Settings from './pages/Settings'

function App() {
  const location = useLocation()
  const hideNavbar = ['/login', '/signup', '/settings'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-slate-50">
      {!hideNavbar && <Navbar />}
      <NotificationToast />
      <AlertNotificationListener />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/report" element={<ReportAlert />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
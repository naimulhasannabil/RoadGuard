import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import NotificationToast from './components/NotificationToast'
import AlertNotificationListener from './components/AlertNotificationListener'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MapPage from './pages/MapPage'
import ReportAlert from './pages/ReportAlert'
import Profile from './pages/Profile'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import Emergency from './pages/Emergency'
import Settings from './pages/Settings'

function AppContent() {
  const location = useLocation()
  const hideNavbar = ['/login', '/admin-login', '/settings', '/admin'].includes(location.pathname)

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
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
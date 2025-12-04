import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import MapPage from './pages/MapPage'
import ReportAlert from './pages/ReportAlert'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/report" element={<ReportAlert />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App

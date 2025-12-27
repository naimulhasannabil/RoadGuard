// Protected Route Component - Redirects to login if not authenticated
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BlockIcon from '@mui/icons-material/Block'
import HomeIcon from '@mui/icons-material/Home'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, isAdmin, user } = useAuth()
  const location = useLocation()

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to appropriate login page
  if (!isAuthenticated) {
    const loginPath = requireAdmin ? '/admin-login' : '/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // Admin route but user is not admin - show access denied
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BlockIcon className="text-red-500" style={{ fontSize: 32 }} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-6">
            Sorry, you don't have permission to access the Admin Dashboard. 
            This area is restricted to authorized administrators only.
          </p>
          <div className="text-sm text-slate-400 mb-6 p-3 bg-slate-50 rounded-lg">
            Signed in as: <span className="font-medium text-slate-600">{user?.email}</span>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            <HomeIcon style={{ fontSize: 20 }} />
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return children
}

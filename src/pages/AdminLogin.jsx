import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import GoogleIcon from '@mui/icons-material/Google'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import SecurityIcon from '@mui/icons-material/Security'
import LockIcon from '@mui/icons-material/Lock'
import { useAuth } from '../context/AuthContext'
import { isAdminEmail } from '../config/adminConfig'

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { signInWithGoogle, isAuthenticated, user, isAdmin } = useAuth()

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      navigate('/admin')
    }
  }, [isAuthenticated, isAdmin, navigate])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    const result = await signInWithGoogle()
    
    if (result.success) {
      // Check if the signed-in user is an admin
      if (isAdminEmail(result.user?.email)) {
        navigate('/admin')
      } else {
        setError('Access denied. This account is not authorized for admin access.')
      }
    } else {
      setError(result.error || 'Sign in failed. Please try again.')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <AdminPanelSettingsIcon className="text-emerald-600" style={{ fontSize: 48 }} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-emerald-100 text-lg">RoadGuard Management Console</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <LockIcon className="text-emerald-600" style={{ fontSize: 24 }} />
            <h2 className="text-xl font-bold text-slate-800">
              Administrator Sign In
            </h2>
          </div>
          
          <p className="text-slate-500 text-center mb-6 text-sm">
            This portal is restricted to authorized administrators only.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <GoogleIcon className="text-[#4285F4]" style={{ fontSize: 24 }} />
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <SecurityIcon className="text-amber-600 shrink-0 mt-0.5" style={{ fontSize: 20 }} />
              <div>
                <p className="text-sm font-medium text-amber-800">Security Notice</p>
                <p className="text-xs text-amber-700 mt-1">
                  Only authorized email addresses can access the admin dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white hover:text-emerald-100 font-medium transition-colors"
          >
            <LocationOnIcon style={{ fontSize: 18 }} />
            Back to RoadGuard
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import GoogleIcon from '@mui/icons-material/Google'
import MapIcon from '@mui/icons-material/Map'
import SecurityIcon from '@mui/icons-material/Security'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    const result = await signInWithGoogle()
    
    if (result.success) {
      navigate('/')
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
            <LocationOnIcon className="text-emerald-600" style={{ fontSize: 48 }} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">RoadGuard</h1>
          <p className="text-emerald-100 text-lg">Real-time Road Safety Alerts</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg">
          <h2 className="text-2xl font-bold mb-2 text-slate-800 text-center">
            Welcome Back!
          </h2>
          <p className="text-slate-500 text-center mb-6">
            Sign in to report and view road alerts in your area
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
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-sm">Quick & Secure</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <MapIcon className="text-emerald-600" style={{ fontSize: 20 }} />
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">Live Map View</p>
                <p className="text-xs text-slate-500">See real-time alerts on map</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <SecurityIcon className="text-blue-600" style={{ fontSize: 20 }} />
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">Verified Reports</p>
                <p className="text-xs text-slate-500">Community-verified alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DirectionsCarIcon className="text-amber-600" style={{ fontSize: 20 }} />
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">Smart Navigation</p>
                <p className="text-xs text-slate-500">Avoid traffic & hazards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <p className="text-emerald-100 text-sm">
            By signing in, you agree to our{' '}
            <a href="#" className="text-white underline hover:no-underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-white underline hover:no-underline">Privacy Policy</a>
          </p>
        </div>

        {/* Continue as Guest */}
        <div className="mt-4 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white hover:text-emerald-100 font-medium transition-colors"
          >
            <MapIcon style={{ fontSize: 18 }} />
            Continue as Guest (View Only)
          </Link>
        </div>
      </div>
    </div>
  )
}
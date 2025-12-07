import { useState } from 'react'
import { Link } from 'react-router-dom'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import SecurityIcon from '@mui/icons-material/Security'
// import axios from 'axios'

export default function Signup() {
  const [name, setName] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const vehicleOptions = [
    { value: 'car', label: 'Car', icon: DirectionsCarIcon },
    { value: 'bike', label: 'Bike/Motorcycle', icon: TwoWheelerIcon },
    { value: 'truck', label: 'Truck', icon: LocalShippingIcon },
  ]

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    // TODO: Integrate with backend signup endpoint
    setTimeout(() => {
      setIsLoading(false)
      alert('Signup submitted (stub). Integrate with backend API.')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4">
            <SecurityIcon className="text-purple-600" style={{ fontSize: 48 }} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">RoadGuard</h1>
          <p className="text-purple-100 text-lg">Join the Guardian Community</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-95">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center">
            Create Account
          </h2>
          
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <PersonIcon className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
              <div className="grid grid-cols-3 gap-3">
                {vehicleOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVehicleType(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        vehicleType === option.value
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <Icon className={vehicleType === option.value ? 'text-purple-600' : 'text-gray-400'} style={{ fontSize: 32 }} />
                      <div className={`text-xs mt-2 font-semibold ${
                        vehicleType === option.value ? 'text-purple-600' : 'text-gray-600'
                      }`}>
                        {option.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EmailIcon className="text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockIcon className="text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500" required />
              <label className="text-gray-600">
                I agree to the <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">Terms of Service</a> and <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-purple-100 text-sm mt-6">
          🚀 Start making roads safer today
        </p>
      </div>
    </div>
  )
}
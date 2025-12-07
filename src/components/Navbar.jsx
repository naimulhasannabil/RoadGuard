import { NavLink } from 'react-router-dom'
import MapIcon from '@mui/icons-material/Map'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import SecurityIcon from '@mui/icons-material/Security'

export default function Navbar() {
  return (
    <nav className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <SecurityIcon className="text-blue-600" style={{ fontSize: 24 }} />
            </div>
            <span className="text-2xl font-bold text-white hidden sm:block">RoadGuard</span>
          </NavLink>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`
              }
            >
              <MapIcon style={{ fontSize: 20 }} />
              <span className="hidden sm:inline">Map</span>
            </NavLink>
            
            <NavLink
              to="/report"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  isActive
                    ? 'bg-white text-orange-600 shadow-md'
                    : 'bg-white text-orange-600 hover:shadow-lg'
                }`
              }
            >
              <ReportProblemIcon style={{ fontSize: 20 }} />
              <span className="hidden sm:inline">Report</span>
            </NavLink>
            
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`
              }
            >
              <AccountCircleIcon style={{ fontSize: 20 }} />
              <span className="hidden sm:inline">Profile</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}
import { NavLink, useLocation } from 'react-router-dom'
import MapIcon from '@mui/icons-material/Map'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import SosIcon from '@mui/icons-material/Sos'

export default function Navbar() {
  const location = useLocation()
  const isMapPage = location.pathname === '/'

  // Hide navbar on map page since it has its own sidebar
  if (isMapPage) return null

  return (
    <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            {/* Professional Logo */}
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">Road</span>
              <span className="text-xl font-bold text-emerald-600 tracking-tight">Guard</span>
            </div>
          </NavLink>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <MapIcon style={{ fontSize: 20 }} />
              <span>Map</span>
            </NavLink>
            
            <NavLink
              to="/report"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <ReportProblemIcon style={{ fontSize: 20 }} />
              <span>Report</span>
            </NavLink>
            
            <NavLink
              to="/emergency"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`
              }
            >
              <SosIcon style={{ fontSize: 20 }} />
              <span>SOS</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}
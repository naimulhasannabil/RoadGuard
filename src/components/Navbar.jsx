import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="text-xl font-semibold">RoadGuard</NavLink>
        <div className="flex items-center gap-4">
          <NavLink to="/" className="hover:text-blue-600">Map</NavLink>
          <NavLink to="/report" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Report Alert</NavLink>
          <NavLink to="/profile" className="hover:text-blue-600">Profile</NavLink>
          <NavLink to="/admin" className="hover:text-blue-600">Admin</NavLink>
          <NavLink to="/login" className="hover:text-blue-600">Login</NavLink>
          <NavLink to="/signup" className="hover:text-blue-600">Signup</NavLink>
        </div>
      </div>
    </nav>
  )
}
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useAlerts, haversineMeters } from '../context/AlertsContext'
import { NavigationPanel, RoutingMachine, LiveLocationTracker, MapClickHandler } from '../components/RouteNavigation'
import { useNavigate } from 'react-router-dom'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SearchIcon from '@mui/icons-material/Search'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import AltRouteIcon from '@mui/icons-material/AltRoute'
import CloseIcon from '@mui/icons-material/Close'
import SettingsIcon from '@mui/icons-material/Settings'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import PersonIcon from '@mui/icons-material/Person'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import FilterListIcon from '@mui/icons-material/FilterList'
import SosIcon from '@mui/icons-material/Sos'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import VerifiedIcon from '@mui/icons-material/Verified'
import StraightenIcon from '@mui/icons-material/Straighten'
import TuneIcon from '@mui/icons-material/Tune'

import HomeIcon from '@mui/icons-material/Home'
import MapIcon from '@mui/icons-material/Map'
import AddIcon from '@mui/icons-material/Add'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

// Hazard types for filtering
const hazardTypes = [
  'All',
  'Traffic Jam',
  'Accident',
  'Road Construction',
  'Road Closure',
  'Flooded Road',
  'Pothole',
  'Broken Traffic Light',
  'Police Checkpoints',
  'Fire on Roadside',
  'Landslides',
  'Fallen Tree',
  'Animal on Road',
  'Other'
]

const severityLevels = ['All', 'Low', 'Medium', 'High']

const severityColor = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444',
}

// Legend items - actual hazard types in the system
const hazardLegend = [
  { type: 'Traffic Jam', filterType: 'Traffic Jam', color: '#f59e0b' },
  { type: 'Accident', filterType: 'Accident', color: '#ef4444' },
  { type: 'Road Construction', filterType: 'Road Construction', color: '#f97316' },
  { type: 'Road Closure', filterType: 'Road Closure', color: '#6b7280' },
  { type: 'Flooded Road', filterType: 'Flooded Road', color: '#3b82f6' },
  { type: 'Pothole', filterType: 'Pothole', color: '#a855f7' },
  { type: 'Police Checkpoint', filterType: 'Police Checkpoints', color: '#8b5cf6' },
  { type: 'Broken Traffic Light', filterType: 'Broken Traffic Light', color: '#eab308' },
  { type: 'Landslide', filterType: 'Landslides', color: '#78716c' },
  { type: 'Fire on Roadside', filterType: 'Fire on Roadside', color: '#dc2626' },
]

// Severity colors for markers
const severityColors = {
  Low: '#22c55e',    // Green
  Medium: '#f59e0b', // Amber
  High: '#ef4444',   // Red
}

// Get color by hazard type (matches legend)
function getHazardColor(type) {
  const hazard = hazardLegend.find(h => h.filterType === type || h.type === type)
  return hazard?.color || '#3b82f6'
}

function MapController({ onMapReady }) {
  const map = useMap()
  useEffect(() => {
    if (map && onMapReady) onMapReady(map)
  }, [map, onMapReady])
  return null
}

// Voice Player Component
function VoicePlayer({ voiceNote }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState(null)
  const audioRef = useRef(null)
  
  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          setError(null)
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (err) {
        setError('Could not play audio')
      }
    }
  }
  
  if (!voiceNote) return null
  
  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-800'
          } text-white`}
        >
          {isPlaying ? <PauseIcon style={{ fontSize: 20 }} /> : <PlayArrowIcon style={{ fontSize: 20 }} />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <VolumeUpIcon style={{ fontSize: 16 }} />
            Voice Report
          </div>
          <div className="text-xs text-slate-500">
            {error ? <span className="text-red-500">{error}</span> : (isPlaying ? 'Playing...' : 'Click to listen')}
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={voiceNote} preload="auto" onEnded={() => setIsPlaying(false)} onError={() => setError('Audio failed')} />
    </div>
  )
}

// Alternate Routes Display
function AlternateRoutesDisplay({ routes }) {
  if (!routes || routes.length === 0) return null
  
  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
        <AltRouteIcon style={{ fontSize: 16 }} />
        Alternate Routes
      </div>
      <div className="space-y-2">
        {routes.map((route, idx) => (
          <div key={route.id || idx} className="text-xs bg-white rounded-lg p-2.5 border border-slate-100">
            <div className="font-medium text-slate-800">{route.from} → {route.to}</div>
            <div className="text-slate-500 mt-1">Via: {route.alternateVia}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Search Component
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) { setSuggestions([]); return }
      setIsLoading(true)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
        const data = await response.json()
        setSuggestions(data.map(item => ({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) })))
        setIsOpen(true)
      } catch (err) { console.error('Search error:', err) }
      setIsLoading(false)
    }
    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (suggestion) => {
    setQuery(suggestion.name.split(',')[0])
    setIsOpen(false)
    onSearch?.(suggestion)
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 20 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search location..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all shadow-sm"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <MyLocationIcon style={{ fontSize: 18 }} className="text-slate-500" />
              </div>
              <span className="text-sm text-slate-700 line-clamp-2">{suggestion.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  const navigate = useNavigate()
  const { alerts, voteAlert, userLocation, setUserLocation, setNearbyRadiusMeters } = useAlerts()
  const [center, setCenter] = useState([23.8103, 90.4125])
  const [filters, setFilters] = useState({ type: 'All', severity: 'All', verifiedOnly: false, maxDistance: 5000 })
  const [map, setMap] = useState(null)
  const [showNavPanel, setShowNavPanel] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  
  // Menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('map')
  
  // Route State
  const [routeStart, setRouteStart] = useState(null)
  const [routeEnd, setRouteEnd] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [isLiveTracking, setIsLiveTracking] = useState(false)
  const [liveTrackingData, setLiveTrackingData] = useState(null)
  const [pickingMode, setPickingMode] = useState(null)

  const userProfile = { name: 'Guest User', avatar: null }

  // Callbacks
  const handleRouteFound = useCallback((info) => setRouteInfo(info), [])
  const handleRouteClear = useCallback(() => { setRouteInfo(null); setSelectedRouteIndex(0) }, [])
  const handleRouteSelect = useCallback((index) => setSelectedRouteIndex(index), [])
  const handleLiveTrackingChange = useCallback((isTracking) => { setIsLiveTracking(isTracking); if (!isTracking) setLiveTrackingData(null) }, [])
  const handleLiveLocationUpdate = useCallback((data) => setLiveTrackingData(data), [])
  const handlePickModeChange = useCallback((mode) => setPickingMode(mode), [])
  const handleLocationPicked = useCallback((location, mode) => {
    if (mode === 'start') setRouteStart(location)
    else if (mode === 'end') setRouteEnd(location)
    setPickingMode(null)
  }, [])

  const [locating, setLocating] = useState(false)
  const watchIdRef = useRef(null)
  
  const goToMyLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser')
      return
    }
    
    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    
    setLocating(true)
    
    // Use watchPosition instead of getCurrentPosition - it's more responsive
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Got location - immediately clear the watch
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
        
        const { latitude: lat, longitude: lng } = pos.coords
        console.log('Location obtained:', lat, lng)
        setUserLocation({ lat, lng })
        setLocating(false)
        
        if (map) {
          map.flyTo([lat, lng], 15, { duration: 0.75 })
        } else {
          setCenter([lat, lng])
        }
      },
      (err) => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
        setLocating(false)
        console.error('Geolocation error:', err.code, err.message)
        
        if (err.code === 1) {
          alert('Location access denied. Please enable location permissions.')
        } else {
          alert('Could not get location. Please try again.')
        }
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 30000 }
    )
    
    // Safety timeout - cancel after 8 seconds if no response
    setTimeout(() => {
      if (watchIdRef.current !== null && locating) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
        setLocating(false)
        console.log('Location timeout - cleared watch')
      }
    }, 8000)
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  const handleSearchSelect = (location) => {
    if (map) map.flyTo([location.lat, location.lng], 15, { duration: 0.75 })
  }

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = [pos.coords.latitude, pos.coords.longitude]
          setCenter(c)
          setUserLocation({ lat: c[0], lng: c[1] })
          setNearbyRadiusMeters(5000)
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [setUserLocation, setNearbyRadiusMeters])

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filters.type !== 'All' && a.type !== filters.type) return false
      if (filters.severity !== 'All' && a.severity !== filters.severity) return false
      if (filters.verifiedOnly && !a.verified) return false
      if (userLocation && filters.maxDistance) {
        const d = haversineMeters(userLocation.lat, userLocation.lng, a.lat, a.lng)
        if (d > filters.maxDistance) return false
      }
      return true
    })
  }, [alerts, filters, userLocation])

  const activeHazards = useMemo(() => alerts.filter(a => !a.expired), [alerts])

  // Close menu handlers
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const closeDesktopSidebar = () => setIsDesktopSidebarOpen(false)
  const closeSidebar = () => {
    setIsMobileMenuOpen(false)
    setIsDesktopSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-white" style={{ overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      
      {/* Overlay - Mobile Only (desktop keeps map active) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[1100] lg:hidden animate-fadeIn"
          onClick={closeSidebar}
        />
      )}

      {/* Left Sidebar - Desktop & Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-[1200] w-80 lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full
        transform transition-transform duration-300 ease-out shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDesktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
      `}>
        {/* Header with Logo */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Professional Logo */}
              <div className="relative w-11 h-11">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl shadow-lg animate-gradient"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <span className="text-lg font-bold text-slate-800 tracking-tight">Road</span>
                <span className="text-lg font-bold text-emerald-600 tracking-tight">Guard</span>
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={closeSidebar}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <CloseIcon className="text-slate-500" style={{ fontSize: 22 }} />
            </button>
          </div>
        </div>

        {/* Profile - Desktop Only */}
        <div className="hidden lg:block p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200 overflow-hidden">
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <PersonIcon className="text-slate-400" style={{ fontSize: 28 }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">{userProfile.name}</h3>
              <button onClick={() => { navigate('/profile'); closeSidebar(); }} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                View profile
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Title */}
        <div className="lg:hidden p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Filters & Settings</h2>
        </div>

        {/* Filters - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Filter Toggle Header */}
          <div className="p-4 border-b border-slate-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <FilterListIcon className="text-slate-600" style={{ fontSize: 22 }} />
                <span className="text-sm font-semibold text-slate-700">Hazard Filters</span>
              </div>
              <KeyboardArrowDownIcon className={`text-slate-400 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} style={{ fontSize: 22 }} />
            </button>
          </div>

          <div className={`transition-all duration-300 ease-out overflow-hidden ${showFilters ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-5 space-y-5">
              {/* Severity Filter */}
              <div className="animate-slideUp" style={{ animationDelay: '0ms' }}>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <WarningAmberIcon style={{ fontSize: 16 }} />
                  Severity Level
                </label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all cursor-pointer"
                >
                  {severityLevels.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Distance Filter */}
              <div className="animate-slideUp" style={{ animationDelay: '50ms' }}>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <StraightenIcon style={{ fontSize: 16 }} />
                  Max Distance: {(filters.maxDistance / 1000).toFixed(1)} km
                </label>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters(f => ({ ...f, maxDistance: Number(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0.5 km</span>
                  <span>20 km</span>
                </div>
              </div>

              {/* Verified Only Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl animate-slideUp" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3">
                  <VerifiedIcon className="text-blue-500" style={{ fontSize: 22 }} />
                  <span className="text-sm font-medium text-slate-700">Verified Only</span>
                </div>
                <button
                  onClick={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
                  className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                    filters.verifiedOnly ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    filters.verifiedOnly ? 'translate-x-6' : 'translate-x-1'
                  }`}></span>
                </button>
              </div>

              {/* Quick Filter Buttons */}
              <div className="animate-slideUp" style={{ animationDelay: '150ms' }}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Quick Filters</label>
                <div className="grid grid-cols-2 gap-2">
                  {hazardLegend.map((item, index) => (
                    <button
                      key={item.filterType}
                      onClick={() => setFilters(f => ({ 
                        ...f, 
                        type: f.type === item.filterType ? 'All' : item.filterType 
                      }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 ${
                        filters.type === item.filterType 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      style={{ animationDelay: `${200 + index * 30}ms` }}
                    >
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0 transition-colors" 
                        style={{ backgroundColor: filters.type === item.filterType ? '#fff' : item.color }}
                      ></span>
                      {item.type}
                    </button>
                  ))}
                </div>
                {filters.type !== 'All' && (
                  <button
                    onClick={() => setFilters(f => ({ ...f, type: 'All', severity: 'All', verifiedOnly: false }))}
                    className="w-full mt-3 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(filters.type !== 'All' || filters.severity !== 'All' || filters.verifiedOnly) && (
            <div className="p-5 border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white animate-fadeIn">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Active Filters</h4>
              <div className="flex flex-wrap gap-2">
                {filters.type !== 'All' && (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium animate-scaleIn">
                    {filters.type}
                  </span>
                )}
                {filters.severity !== 'All' && (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium animate-scaleIn ${
                    filters.severity === 'High' ? 'bg-red-100 text-red-700' :
                    filters.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {filters.severity} Severity
                  </span>
                )}
                {filters.verifiedOnly && (
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium animate-scaleIn">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Showing {filtered.length} of {alerts.length} hazards
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 space-y-1 bg-white">
          <button onClick={() => { navigate('/admin'); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
            <AdminPanelSettingsIcon style={{ fontSize: 20 }} />
            <span className="text-sm font-medium">Admin Panel</span>
          </button>
          <button onClick={() => { navigate('/settings'); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
            <SettingsIcon style={{ fontSize: 20 }} />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button onClick={closeSidebar} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
            <HelpOutlineIcon style={{ fontSize: 20 }} />
            <span className="text-sm font-medium">Help & Support</span>
          </button>
          <button onClick={() => { navigate('/login'); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.98]">
            <LogoutIcon style={{ fontSize: 20 }} />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative h-full" style={{ overflow: 'hidden' }}>
        
        {/* Mobile Header */}
        <div className="absolute top-0 left-0 right-0 z-[1000] lg:hidden">
          <div className="bg-white/95 backdrop-blur-lg border-b border-slate-200 px-4 py-3 flex items-center justify-between safe-area-top">
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">Road<span className="text-emerald-600">Guard</span></span>
            </div>
            <button
              onClick={() => navigate('/emergency')}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
            >
              <SosIcon style={{ fontSize: 16 }} />
              <span className="text-xs font-bold">SOS</span>
            </button>
          </div>
        </div>

        {/* Desktop Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-[1000] hidden lg:block">
          <div className="px-5 py-4 flex items-center justify-between">
            {/* Left: Menu Button + Logo + Search */}
            <div className="flex items-center gap-3">
              {/* Menu Button */}
              <button
                onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="w-11 h-11 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center hover:shadow-xl hover:border-slate-300 transition-all active:scale-95 group"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="w-5 h-0.5 bg-slate-600 rounded-full group-hover:bg-emerald-600 transition-colors"></span>
                  <span className="w-5 h-0.5 bg-slate-600 rounded-full group-hover:bg-emerald-600 transition-colors"></span>
                  <span className="w-5 h-0.5 bg-slate-600 rounded-full group-hover:bg-emerald-600 transition-colors"></span>
                </div>
              </button>
              {/* Mini Logo */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-white" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <span className="text-base font-bold text-slate-800">Road<span className="text-emerald-600">Guard</span></span>
              </div>
              {/* Search */}
              <div className="w-80 ml-2">
                <SearchBar onSearch={handleSearchSelect} />
              </div>
            </div>
            {/* Right: SOS */}
            <button
              onClick={() => navigate('/emergency')}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
            >
              <SosIcon style={{ fontSize: 18 }} />
              <span className="text-sm font-bold">SOS</span>
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile Only */}
        <div className="absolute top-20 left-4 right-4 z-[1000] lg:hidden">
          <SearchBar onSearch={handleSearchSelect} />
        </div>

        {/* Picking Mode Banner - Responsive */}
        {pickingMode && (
          <div className={`absolute top-36 lg:top-24 left-4 right-4 lg:left-6 lg:right-6 z-[1001] px-4 lg:px-6 py-3 lg:py-4 rounded-2xl flex items-center justify-between ${
            pickingMode === 'start' ? 'bg-emerald-500' : 'bg-rose-500'
          } text-white shadow-xl animate-slideDown`}>
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <MyLocationIcon style={{ fontSize: 20 }} />
              </div>
              <span className="font-semibold text-sm lg:text-lg">Tap map to set {pickingMode === 'start' ? 'start' : 'destination'}</span>
            </div>
            <button onClick={() => setPickingMode(null)} className="p-2 lg:p-2.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors active:scale-95">
              <CloseIcon style={{ fontSize: 20 }} />
            </button>
          </div>
        )}

        {/* Navigation Toggle - Desktop */}
        <button
          onClick={() => setShowNavPanel(!showNavPanel)}
          className={`absolute top-20 lg:top-24 right-4 lg:right-6 z-[1000] hidden lg:flex px-4 py-3 rounded-xl shadow-lg border transition-all items-center gap-2 ${
            showNavPanel 
              ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
              : 'bg-white text-slate-700 border-slate-200 hover:shadow-xl'
          }`}
        >
          <AltRouteIcon style={{ fontSize: 20 }} />
          <span className="text-sm font-semibold">Route Navigation</span>
          <KeyboardArrowDownIcon className={`transition-transform duration-300 ${showNavPanel ? 'rotate-180' : ''}`} style={{ fontSize: 20 }} />
        </button>

        {/* Navigation Panel - Desktop */}
        {showNavPanel && (
          <div className="absolute top-40 right-6 z-[1000] hidden lg:block animate-slideDown">
            <NavigationPanel
              userLocation={userLocation}
              alerts={alerts}
              start={routeStart}
              end={routeEnd}
              onStartChange={setRouteStart}
              onEndChange={setRouteEnd}
              onLiveTrackingChange={handleLiveTrackingChange}
              liveTrackingData={liveTrackingData}
              pickingMode={pickingMode}
              onPickModeChange={handlePickModeChange}
              routeInfo={routeInfo}
              onRouteSelect={handleRouteSelect}
            />
          </div>
        )}

        {/* Map Controls - Right Side */}
        <div className="absolute bottom-24 lg:bottom-24 right-4 lg:right-6 z-[1000] flex flex-col gap-2">
          {/* Zoom Controls */}
          <div className="flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <button onClick={() => map?.zoomIn()} className="px-3 py-2 lg:px-3.5 lg:py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 text-slate-700 font-bold active:bg-slate-100">+</button>
            <button onClick={() => map?.zoomOut()} className="px-3 py-2 lg:px-3.5 lg:py-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-bold active:bg-slate-100">−</button>
          </div>
          {/* My Location Button */}
          <button 
            onClick={goToMyLocation}
            disabled={locating}
            className={`w-10 h-10 lg:w-11 lg:h-11 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center hover:shadow-xl active:scale-95 transition-all ${locating ? 'animate-pulse' : ''}`}
            title="My Location"
          >
            {locating ? (
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <MyLocationIcon className="text-slate-700" style={{ fontSize: 20 }} />
            )}
          </button>
        </div>

        {/* Report Hazard - Floating Button - Desktop Only */}
        <button 
          onClick={() => navigate('/report')}
          className="absolute bottom-6 right-6 z-[1000] hidden lg:flex px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg items-center gap-2 transition-all hover:shadow-xl active:scale-95"
        >
          <ReportProblemIcon style={{ fontSize: 20 }} />
          <span className="font-semibold text-sm">Report Hazard</span>
        </button>

        {/* Mobile Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] lg:hidden safe-area-bottom">
          <div className="bg-white/95 backdrop-blur-lg border-t border-slate-200 px-4 py-2">
            <div className="flex items-center justify-around">
              <button 
                onClick={() => { setShowNavPanel(false); setIsMobileMenuOpen(false); }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 ${
                  !showNavPanel && !isMobileMenuOpen ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <MapIcon style={{ fontSize: 22 }} />
                <span className="text-[10px] font-medium">Map</span>
              </button>
              <button 
                onClick={() => { setShowNavPanel(!showNavPanel); setIsMobileMenuOpen(false); }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 ${
                  showNavPanel ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <AltRouteIcon style={{ fontSize: 22 }} />
                <span className="text-[10px] font-medium">Route</span>
              </button>
              <button 
                onClick={() => navigate('/report')}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-300/50 active:scale-95 transition-transform">
                  <AddIcon className="text-white" style={{ fontSize: 28 }} />
                </div>
                <span className="text-[10px] font-medium text-slate-500 mt-1">Report</span>
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 text-slate-400"
              >
                <PersonIcon style={{ fontSize: 22 }} />
                <span className="text-[10px] font-medium">Profile</span>
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); setShowNavPanel(false); }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 ${
                  isMobileMenuOpen ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <TuneIcon style={{ fontSize: 22 }} />
                <span className="text-[10px] font-medium">Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {showNavPanel && (
          <div className="absolute bottom-20 left-4 right-4 z-[1000] lg:hidden animate-slideUp">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[50vh] overflow-y-auto">
              <NavigationPanel
                userLocation={userLocation}
                alerts={alerts}
                start={routeStart}
                end={routeEnd}
                onStartChange={setRouteStart}
                onEndChange={setRouteEnd}
                onLiveTrackingChange={handleLiveTrackingChange}
                liveTrackingData={liveTrackingData}
                pickingMode={pickingMode}
                onPickModeChange={handlePickModeChange}
                routeInfo={routeInfo}
                onRouteSelect={handleRouteSelect}
              />
            </div>
          </div>
        )}

        {/* Map */}
        <div className="absolute inset-0">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <MapController onMapReady={setMap} />
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <RoutingMachine start={routeStart} end={routeEnd} hazards={activeHazards} onRouteFound={handleRouteFound} onRouteClear={handleRouteClear} selectedRouteIndex={selectedRouteIndex} onRouteSelect={handleRouteSelect} />
            <LiveLocationTracker isTracking={isLiveTracking} onLocationUpdate={handleLiveLocationUpdate} destination={routeEnd} />
            <MapClickHandler isActive={pickingMode !== null} pickingMode={pickingMode} onLocationPicked={handleLocationPicked} />

            {/* User Location */}
            {userLocation && (
              <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={10} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3, weight: 3 }}>
                <Popup><div className="text-center py-1 font-medium text-slate-700">Your Location</div></Popup>
              </CircleMarker>
            )}

            {/* Hazard Markers */}
            {filtered.map((a) => {
              const markerColor = getHazardColor(a.type)
              return (
                <CircleMarker
                  key={a.id}
                  center={[a.lat, a.lng]}
                  radius={12}
                  pathOptions={{ color: markerColor, fillColor: markerColor, fillOpacity: 0.7, weight: 2 }}
                >
                <Popup>
                  <div className="min-w-[240px] p-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-base">{a.type}</h3>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                        a.severity === 'High' ? 'bg-red-100 text-red-700' :
                        a.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>{a.severity}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <PersonIcon style={{ fontSize: 18 }} className="text-slate-400" />
                        <span>By: {a.contributor}</span>
                      </div>
                      <div className="text-slate-500 text-xs">{new Date(a.timestamp).toLocaleString()}</div>
                      {userLocation && <div className="text-slate-600 text-xs">{haversineMeters(userLocation.lat, userLocation.lng, a.lat, a.lng).toFixed(0)} m away</div>}
                      {a.description && <p className="text-slate-600 bg-slate-50 rounded-lg p-2 mt-2 text-xs">{a.description}</p>}
                    </div>
                    {a.voiceNote && <VoicePlayer voiceNote={a.voiceNote} />}
                    {a.alternateRoutes && <AlternateRoutesDisplay routes={a.alternateRoutes} />}
                    {a.photos?.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {a.photos.map((p) => <img key={p.url} src={p.url} alt={p.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200" />)}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => voteAlert(a.id, +1)} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors">👍 {a.votesUp || 0}</button>
                      <button onClick={() => voteAlert(a.id, -1)} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors">👎 {a.votesDown || 0}</button>
                    </div>
                    {a.verified && <div className="mt-2 text-center"><span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">✓ Verified</span></div>}
                  </div>
                </Popup>
              </CircleMarker>
              )
            })}
          </MapContainer>
        </div>
      </main>
    </div>
  )
}

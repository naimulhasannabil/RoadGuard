import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAlerts, haversineMeters } from '../context/AlertsContext'
import { useAuth } from '../context/AuthContext'
import { NavigationPanel, RoutingMachine, LiveLocationTracker, MapClickHandler } from '../components/RouteNavigation'
import { useNavigate } from 'react-router-dom'
import LoginIcon from '@mui/icons-material/Login'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SearchIcon from '@mui/icons-material/Search'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import StopIcon from '@mui/icons-material/Stop'
import SpeedIcon from '@mui/icons-material/Speed'
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
// Modal-related icons (from main)
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import CommentIcon from '@mui/icons-material/Comment'
import ShareIcon from '@mui/icons-material/Share'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SendIcon from '@mui/icons-material/Send'
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

// Legend items - actual hazard types in the system (matching ReportAlert types)
const hazardLegend = [
  { type: 'Traffic Jam', filterType: 'Traffic Jam', color: '#f59e0b' },
  { type: 'Heavy Traffic Jam', filterType: 'Heavy Traffic Jam', color: '#9333ea' },
  { type: 'Accident', filterType: 'Accident', color: '#ef4444' },
  { type: 'Road Construction', filterType: 'Road Construction', color: '#f97316' },
  { type: 'Road Closure', filterType: 'Road Closure', color: '#6b7280' },
  { type: 'Road Closures', filterType: 'Road Closures', color: '#6b7280' },
  { type: 'Flooded Road', filterType: 'Flooded Road', color: '#3b82f6' },
  { type: 'Floods', filterType: 'Floods', color: '#3b82f6' },
  { type: 'Pothole', filterType: 'Pothole', color: '#a855f7' },
  { type: 'Potholes', filterType: 'Potholes', color: '#a855f7' },
  { type: 'Police Checkpoint', filterType: 'Police Checkpoints', color: '#8b5cf6' },
  { type: 'Broken Traffic Light', filterType: 'Broken Traffic Light', color: '#eab308' },
  { type: 'Broken Roads', filterType: 'Broken Roads', color: '#f97316' },
  { type: 'Landslide', filterType: 'Landslides', color: '#78716c' },
  { type: 'Landslides', filterType: 'Landslides', color: '#78716c' },
  { type: 'Fire on Roadside', filterType: 'Fire on Roadside', color: '#dc2626' },
  { type: 'Animal Crossing', filterType: 'Animal Crossing', color: '#16a34a' },
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

// Hazard type to icon emoji mapping
const hazardIcons = {
  'Potholes': '🕳️',
  'Pothole': '🕳️',
  'Accident': '🚨',
  'Floods': '🌊',
  'Flooded Road': '🌊',
  'Broken Roads': '🚧',
  'Road Construction': '🚧',
  'Landslides': '⛰️',
  'Landslide': '⛰️',
  'Road Closures': '🚫',
  'Road Closure': '🚫',
  'Police Checkpoints': '👮',
  'Police Checkpoint': '👮',
  'Heavy Traffic Jam': '🚗',
  'Traffic Jam': '🚗',
  'Fire on Roadside': '🔥',
  'Animal Crossing': '🦌',
  'Broken Traffic Light': '🚦',
}

// Create custom hazard marker icon
function createHazardIcon(type, severity) {
  const icon = hazardIcons[type] || '⚠️'
  const color = getHazardColor(type)
  const borderColor = severity === 'High' ? '#ef4444' : severity === 'Medium' ? '#f59e0b' : '#22c55e'
  
  return L.divIcon({
    className: 'custom-hazard-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: white;
        border: 3px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${icon}
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${borderColor};
        "></div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  })
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

// Photo Gallery Modal Component (NEW from main)
function PhotoGalleryModal({ photos, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0)
  
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % photos.length)
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  if (!photos || photos.length === 0) return null
  
  return (
    <div className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
      >
        <CloseIcon style={{ fontSize: 28 }} />
      </button>
      
      <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {photos.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
            >
              <NavigateBeforeIcon style={{ fontSize: 32 }} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
            >
              <NavigateNextIcon style={{ fontSize: 32 }} />
            </button>
          </>
        )}
        
        <img
          src={photos[currentIndex]?.url}
          alt={photos[currentIndex]?.name || 'Photo'}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        
        {photos.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
        
        <div className="absolute bottom-6 right-6 text-white/60 text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  )
}

// Alert Details Modal Component (NEW from main)
function AlertDetailsModal({ alert, onClose, userLocation, voteAlert, comments, onAddComment }) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)
  const [copied, setCopied] = useState(false)
  const [newComment, setNewComment] = useState('')
  
  const distance = userLocation 
    ? haversineMeters(userLocation.lat, userLocation.lng, alert.lat, alert.lng)
    : null
  
  const getSeverityStyles = (severity) => {
    switch(severity) {
      case 'High': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: '🔴', gradient: 'from-red-500 to-red-600' }
      case 'Medium': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: '🟠', gradient: 'from-orange-500 to-orange-600' }
      default: return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: '🟢', gradient: 'from-green-500 to-green-600' }
    }
  }
  
  const severityStyles = getSeverityStyles(alert.severity)
  
  const copyLocation = async () => {
    const text = `📍 ${alert.type} at ${alert.lat.toFixed(6)}, ${alert.lng.toFixed(6)}\n🗺️ https://www.google.com/maps?q=${alert.lat},${alert.lng}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const shareAlert = async () => {
    const shareData = {
      title: `RoadGuard Alert: ${alert.type}`,
      text: `⚠️ ${alert.severity} severity ${alert.type} reported!\n${alert.description || ''}\n📍 Location: ${alert.lat.toFixed(6)}, ${alert.lng.toFixed(6)}`,
      url: `https://www.google.com/maps?q=${alert.lat},${alert.lng}`
    }
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      copyLocation()
    }
  }
  
  const addComment = () => {
    if (!newComment.trim()) return
    onAddComment({
      id: Date.now(),
      author: 'You',
      text: newComment,
      time: 'Just now',
      isOfficial: false
    })
    setNewComment('')
  }
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])
  
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${severityStyles.gradient} p-6 text-white relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
            >
              <CloseIcon />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                {alert.type === 'Potholes' && '🕳️'}
                {alert.type === 'Accident' && '🚨'}
                {alert.type === 'Floods' && '🌊'}
                {alert.type === 'Broken Roads' && '🚧'}
                {alert.type === 'Landslides' && '⛰️'}
                {alert.type === 'Road Closures' && '🚫'}
                {alert.type === 'Police Checkpoints' && '👮'}
                {alert.type === 'Heavy Traffic Jam' && '🚗'}
                {alert.type === 'Fire on Roadside' && '🔥'}
                {alert.type === 'Animal Crossing' && '🦌'}
                {!['Potholes', 'Accident', 'Floods', 'Broken Roads', 'Landslides', 'Road Closures', 'Police Checkpoints', 'Heavy Traffic Jam', 'Fire on Roadside', 'Animal Crossing'].includes(alert.type) && '⚠️'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{alert.type}</h2>
                  {alert.verified && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                      <VerifiedIcon style={{ fontSize: 16 }} />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                  <span className="flex items-center gap-1">
                    <AccessTimeIcon style={{ fontSize: 16 }} />
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <PersonIcon style={{ fontSize: 16 }} />
                    {alert.contributor}
                  </span>
                  {distance && (
                    <span className="flex items-center gap-1">
                      <LocationOnIcon style={{ fontSize: 16 }} />
                      {distance < 1000 ? `${distance.toFixed(0)}m away` : `${(distance/1000).toFixed(1)}km away`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Severity & Votes Row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${severityStyles.bg} ${severityStyles.border} border-2`}>
                  <span className="text-xl">{severityStyles.icon}</span>
                  <span className={`font-bold ${severityStyles.text}`}>{alert.severity} Severity</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => voteAlert(alert.id, +1)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl font-semibold transition-all"
                  >
                    <ThumbUpIcon style={{ fontSize: 20 }} />
                    <span>{alert.votesUp || 0}</span>
                  </button>
                  <button
                    onClick={() => voteAlert(alert.id, -1)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-semibold transition-all"
                  >
                    <ThumbDownIcon style={{ fontSize: 20 }} />
                    <span>{alert.votesDown || 0}</span>
                  </button>
                </div>
              </div>
              
              {/* Description */}
              {alert.description && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <WarningAmberIcon className="text-orange-500" />
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{alert.description}</p>
                </div>
              )}
              
              {/* Voice Note */}
              {alert.voiceNote && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200">
                  <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                    <VolumeUpIcon className="text-purple-500" />
                    Voice Report
                  </h3>
                  <VoicePlayer voiceNote={alert.voiceNote} />
                </div>
              )}
              
              {/* Photos Gallery */}
              {alert.photos && alert.photos.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <PhotoLibraryIcon className="text-blue-500" />
                    Photos ({alert.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {alert.photos.map((photo, idx) => (
                      <div
                        key={photo.url}
                        className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square bg-gray-200"
                        onClick={() => setSelectedPhotoIndex(idx)}
                      >
                        <img
                          src={photo.url}
                          alt={photo.name || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <OpenInFullIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: 32 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Alternate Routes */}
              {alert.alternateRoutes && alert.alternateRoutes.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
                  <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <AltRouteIcon className="text-emerald-500" />
                    Suggested Alternate Routes
                  </h3>
                  <div className="space-y-3">
                    {alert.alternateRoutes.map((route, idx) => (
                      <div key={route.id || idx} className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                        <div className="font-semibold text-gray-800 mb-1">
                          {route.from} → {route.to}
                        </div>
                        <div className="text-emerald-600 text-sm">Via: {route.alternateVia}</div>
                        {route.estimatedTime && (
                          <div className="text-gray-500 text-sm mt-1">Estimated time: {route.estimatedTime}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Location Info */}
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <LocationOnIcon className="text-blue-500" />
                  Location
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <code className="px-3 py-2 bg-white rounded-lg text-sm text-gray-700 border border-blue-200">
                    {alert.lat.toFixed(6)}, {alert.lng.toFixed(6)}
                  </code>
                  <button
                    onClick={copyLocation}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {copied ? <CheckCircleIcon style={{ fontSize: 18 }} /> : <ContentCopyIcon style={{ fontSize: 18 }} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${alert.lat},${alert.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg font-semibold hover:bg-blue-100 transition-all"
                  >
                    <LocationOnIcon style={{ fontSize: 18 }} />
                    Open in Maps
                  </a>
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CommentIcon className="text-purple-500" />
                  Comments & Updates ({comments.length})
                </h3>
                
                {/* Add Comment */}
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    placeholder="Add a comment or update..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SendIcon />
                  </button>
                </div>
                
                {/* Comments List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className={`p-4 rounded-xl ${
                        comment.isOfficial 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-semibold ${comment.isOfficial ? 'text-blue-700' : 'text-gray-800'}`}>
                          {comment.author}
                        </span>
                        {comment.isOfficial && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            <VerifiedIcon style={{ fontSize: 12 }} />
                            Official
                          </span>
                        )}
                        <span className="text-gray-400 text-xs ml-auto">{comment.time}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Alert ID: #{alert.id}</span>
              {alert.expired && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">Expired</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={shareAlert}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <ShareIcon style={{ fontSize: 20 }} />
                Share Alert
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Photo Gallery Modal */}
      {selectedPhotoIndex !== null && (
        <PhotoGalleryModal
          photos={alert.photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </>
  )
}

// Search Component (from Arafath)
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
  const { alerts, voteAlert, userLocation, setUserLocation, setNearbyRadiusMeters, getCommentsForAlert, addCommentToAlert } = useAlerts()
  const { user, isAuthenticated, signOut } = useAuth()
  const [center, setCenter] = useState([23.8103, 90.4125])
  const [filters, setFilters] = useState({ type: 'All', severity: 'All', verifiedOnly: false, maxDistance: 5000 })
  const [map, setMap] = useState(null)
  const [showNavPanel, setShowNavPanel] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState(null) // For alert details modal
  
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

  const userProfile = isAuthenticated && user 
    ? { name: user.name || user.email?.split('@')[0] || 'User', avatar: user.photoURL || null }
    : { name: 'Guest', avatar: null }

  // Callbacks
  const handleRouteFound = useCallback((info) => setRouteInfo(info), [])
  const handleRouteClear = useCallback(() => { setRouteInfo(null); setSelectedRouteIndex(0) }, [])
  const handleRouteSelect = useCallback((index) => setSelectedRouteIndex(index), [])
  const handleLiveTrackingChange = useCallback((isTracking) => { 
    setIsLiveTracking(isTracking)
    if (!isTracking) {
      setLiveTrackingData(null)
    } else {
      // Auto-collapse panel when navigation starts for better map visibility
      setShowNavPanel(false)
    }
  }, [])
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
              {isAuthenticated ? (
                <button onClick={() => { navigate('/profile'); closeSidebar(); }} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  View profile
                </button>
              ) : (
                <button onClick={() => { navigate('/login'); closeSidebar(); }} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                  Sign in with Google
                </button>
              )}
            </div>
            {isAuthenticated && (
              <button 
                onClick={async () => { await signOut(); closeSidebar(); }} 
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogoutIcon style={{ fontSize: 20 }} />
              </button>
            )}
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
          {isAuthenticated ? (
            <button onClick={async () => { await signOut(); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.98]">
              <LogoutIcon style={{ fontSize: 20 }} />
              <span className="text-sm font-medium">Sign out</span>
            </button>
          ) : (
            <button onClick={() => { navigate('/login'); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-[0.98]">
              <LoginIcon style={{ fontSize: 20 }} />
              <span className="text-sm font-medium">Sign in with Google</span>
            </button>
          )}
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
              : isLiveTracking
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500'
                : 'bg-white text-slate-700 border-slate-200 hover:shadow-xl'
          }`}
        >
          <AltRouteIcon style={{ fontSize: 20 }} />
          <span className="text-sm font-semibold">
            {isLiveTracking && !showNavPanel ? 'Navigation' : 'Route Navigation'}
          </span>
          <KeyboardArrowDownIcon className={`transition-transform duration-300 ${showNavPanel ? 'rotate-180' : ''}`} style={{ fontSize: 20 }} />
        </button>

        {/* Compact Navigation Widget - Desktop (shows when navigating and panel is closed) */}
        {isLiveTracking && !showNavPanel && (
          <div className="absolute top-36 right-6 z-[1000] hidden lg:block animate-slideDown">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-4 w-72">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-50"></div>
                  </div>
                  <span className="text-white font-bold text-sm">Live Navigation</span>
                </div>
                <button 
                  onClick={() => handleLiveTrackingChange(false)}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <StopIcon style={{ fontSize: 14 }} />
                  Stop
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white/20 backdrop-blur rounded-xl p-2 text-center">
                  <div className="text-white/70 text-[10px] mb-0.5">SPEED</div>
                  <div className="text-white font-bold text-lg">{((liveTrackingData?.speed || 0) * 3.6).toFixed(0)}</div>
                  <div className="text-white/60 text-[9px]">km/h</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-2 text-center">
                  <div className="text-white/70 text-[10px] mb-0.5">DISTANCE</div>
                  <div className="text-white font-bold text-lg">
                    {liveTrackingData?.distanceToDestination 
                      ? (liveTrackingData.distanceToDestination >= 1000 
                          ? (liveTrackingData.distanceToDestination / 1000).toFixed(1)
                          : Math.round(liveTrackingData.distanceToDestination))
                      : '--'}
                  </div>
                  <div className="text-white/60 text-[9px]">{liveTrackingData?.distanceToDestination >= 1000 ? 'km' : 'm'}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-2 text-center">
                  <div className="text-white/70 text-[10px] mb-0.5">ETA</div>
                  <div className="text-white font-bold text-lg">
                    {(() => {
                      const dist = liveTrackingData?.distanceToDestination || 0
                      const speed = (liveTrackingData?.speed || 0) * 3.6
                      if (speed > 1 && dist > 0) {
                        const timeMin = Math.ceil((dist / 1000) / speed * 60)
                        return timeMin < 60 ? timeMin : Math.floor(timeMin / 60)
                      }
                      return typeof routeInfo?.duration === 'string' 
                        ? routeInfo.duration.replace(/[^0-9]/g, '') 
                        : routeInfo?.duration || '--'
                    })()}
                  </div>
                  <div className="text-white/60 text-[9px]">min</div>
                </div>
              </div>
              
              {/* Expand button */}
              <button 
                onClick={() => setShowNavPanel(true)}
                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <span>Show Full Panel</span>
                <KeyboardArrowDownIcon style={{ fontSize: 16 }} />
              </button>
              
              {/* Arrival notification */}
              {liveTrackingData?.distanceToDestination && liveTrackingData.distanceToDestination < 50 && (
                <div className="mt-3 bg-white text-emerald-700 rounded-xl p-3 text-center font-bold animate-bounce">
                  🎉 You have arrived!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Panel - Desktop (Full panel) */}
        {showNavPanel && (
          <div className={`absolute top-40 right-6 z-[1000] hidden lg:block animate-slideDown ${isLiveTracking ? 'max-h-[70vh] overflow-y-auto' : ''}`}>
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

        {/* Mobile Navigation Panel - Smart Collapsible Design */}
        {showNavPanel && (
          <div className={`absolute left-4 right-4 z-[1000] lg:hidden transition-all duration-300 ${
            pickingMode ? 'bottom-20' : 'bottom-20'
          }`}>
            {/* Minimized Navigation Bar - When live tracking is active */}
            {isLiveTracking ? (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-2xl p-3 animate-slideUp">
                {/* Top row: Live indicator + Stop button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-white font-bold text-sm">Navigation Active</span>
                  </div>
                  
                  <button 
                    onClick={() => handleLiveTrackingChange(false)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold text-sm flex items-center gap-1.5 transition-colors shadow-lg"
                  >
                    <StopIcon style={{ fontSize: 18 }} />
                    Stop
                  </button>
                </div>
                
                {/* Stats Grid: Speed, Distance, Time */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Speed */}
                  <div className="bg-white/20 backdrop-blur rounded-xl p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-white/80 text-[10px] mb-1">
                      <SpeedIcon style={{ fontSize: 12 }} />
                      <span>SPEED</span>
                    </div>
                    <div className="text-white font-bold text-lg">
                      {((liveTrackingData?.speed || 0) * 3.6).toFixed(0)}
                    </div>
                    <div className="text-white/70 text-[10px]">km/h</div>
                  </div>
                  
                  {/* Distance */}
                  <div className="bg-white/20 backdrop-blur rounded-xl p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-white/80 text-[10px] mb-1">
                      <StraightenIcon style={{ fontSize: 12 }} />
                      <span>DISTANCE</span>
                    </div>
                    <div className="text-white font-bold text-lg">
                      {liveTrackingData?.distanceToDestination 
                        ? (liveTrackingData.distanceToDestination >= 1000 
                            ? (liveTrackingData.distanceToDestination / 1000).toFixed(1)
                            : Math.round(liveTrackingData.distanceToDestination))
                        : (typeof routeInfo?.distance === 'string' 
                            ? routeInfo.distance.replace(/[^0-9.]/g, '') 
                            : routeInfo?.distance || '--')}
                    </div>
                    <div className="text-white/70 text-[10px]">
                      {liveTrackingData?.distanceToDestination >= 1000 ? 'km' : 'm'}
                    </div>
                  </div>
                  
                  {/* ETA */}
                  <div className="bg-white/20 backdrop-blur rounded-xl p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-white/80 text-[10px] mb-1">
                      <AccessTimeIcon style={{ fontSize: 12 }} />
                      <span>ETA</span>
                    </div>
                    <div className="text-white font-bold text-lg">
                      {(() => {
                        const dist = liveTrackingData?.distanceToDestination || 0
                        const speed = (liveTrackingData?.speed || 0) * 3.6 // km/h
                        if (speed > 1 && dist > 0) {
                          const timeMin = Math.ceil((dist / 1000) / speed * 60)
                          return timeMin < 60 ? timeMin : Math.floor(timeMin / 60)
                        }
                        // Handle both string and number for duration
                        if (typeof routeInfo?.duration === 'string') {
                          return routeInfo.duration.replace(/[^0-9]/g, '') || '--'
                        }
                        return routeInfo?.duration || '--'
                      })()}
                    </div>
                    <div className="text-white/70 text-[10px]">
                      {(() => {
                        const dist = liveTrackingData?.distanceToDestination || 0
                        const speed = (liveTrackingData?.speed || 0) * 3.6
                        if (speed > 1 && dist > 0) {
                          const timeMin = Math.ceil((dist / 1000) / speed * 60)
                          return timeMin < 60 ? 'min' : 'hr'
                        }
                        return 'min'
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Arrival notification */}
                {liveTrackingData?.distanceToDestination && liveTrackingData.distanceToDestination < 50 && (
                  <div className="mt-3 bg-white text-emerald-700 rounded-xl p-3 text-center font-bold animate-bounce shadow-lg">
                    🎉 You have arrived at your destination!
                  </div>
                )}
              </div>
            ) : pickingMode ? (
              /* Minimized Mode - When picking location on map */
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 animate-slideUp">
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl flex-1 ${
                    pickingMode === 'start' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${pickingMode === 'start' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <span className="text-sm font-semibold">
                      {pickingMode === 'start' ? 'Tap to set START' : 'Tap to set DESTINATION'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setPickingMode(null)}
                    className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <CloseIcon style={{ fontSize: 20 }} className="text-slate-600" />
                  </button>
                </div>
                
                {/* Quick location info */}
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <MyLocationIcon style={{ fontSize: 14 }} />
                  <span>Or use the search in the expanded panel</span>
                  <button 
                    onClick={() => setPickingMode(null)} 
                    className="ml-auto text-emerald-600 font-semibold underline"
                  >
                    Expand
                  </button>
                </div>
              </div>
            ) : (
              /* Expanded Mode - Full Navigation Panel */
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[45vh] overflow-y-auto animate-slideUp">
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
                  isMobile={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div className="absolute inset-0">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <MapController onMapReady={setMap} />
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <RoutingMachine start={routeStart} end={routeEnd} hazards={activeHazards} onRouteFound={handleRouteFound} onRouteClear={handleRouteClear} selectedRouteIndex={selectedRouteIndex} onRouteSelect={handleRouteSelect} isLiveTracking={isLiveTracking} />
            <LiveLocationTracker isTracking={isLiveTracking} onLocationUpdate={handleLiveLocationUpdate} destination={routeEnd} />
            <MapClickHandler isActive={pickingMode !== null} pickingMode={pickingMode} onLocationPicked={handleLocationPicked} />

            {/* User Location - Professional animated marker */}
            {userLocation && (
              <Marker 
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  className: 'user-location-marker',
                  html: isLiveTracking ? `
                    <div class="relative flex items-center justify-center">
                      <!-- Outer pulse ring -->
                      <div class="absolute w-16 h-16 rounded-full bg-emerald-400/20 animate-ping"></div>
                      <!-- Middle ring -->
                      <div class="absolute w-12 h-12 rounded-full bg-emerald-400/30 animate-pulse"></div>
                      <!-- Glow effect -->
                      <div class="absolute w-8 h-8 rounded-full bg-emerald-500/50 blur-sm"></div>
                      <!-- Main marker body -->
                      <div class="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50 flex items-center justify-center border-3 border-white">
                        <!-- Navigation arrow -->
                        <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                        </svg>
                      </div>
                      <!-- Accuracy ring -->
                      <div class="absolute w-14 h-14 rounded-full border-2 border-emerald-400 border-dashed opacity-60" style="animation: spin 8s linear infinite;"></div>
                    </div>
                  ` : `
                    <div class="relative flex items-center justify-center">
                      <!-- Soft glow -->
                      <div class="absolute w-6 h-6 rounded-full bg-blue-500/30 blur-sm"></div>
                      <!-- Main marker -->
                      <div class="relative w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md shadow-blue-500/40 border-2 border-white flex items-center justify-center">
                        <div class="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    </div>
                  `,
                  iconSize: [64, 64],
                  iconAnchor: [32, 32],
                  popupAnchor: [0, -20]
                })}
              >
                <Popup>
                  <div className="text-center py-2 px-3">
                    <div className="font-bold text-slate-800 mb-1">
                      {isLiveTracking ? '🧭 Live Navigation' : '📍 Your Location'}
                    </div>
                    {isLiveTracking && liveTrackingData?.speed && (
                      <div className="text-xs text-emerald-600 font-medium">
                        Moving at {((liveTrackingData.speed || 0) * 3.6).toFixed(0)} km/h
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Hazard Markers */}
            {filtered.map((a) => {
              const hazardIcon = createHazardIcon(a.type, a.severity)
              return (
                <Marker
                  key={a.id}
                  position={[a.lat, a.lng]}
                  icon={hazardIcon}
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
                    {/* View Full Details Button (from main) */}
                    <button
                      onClick={() => setSelectedAlert(a)}
                      className="w-full mt-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <OpenInFullIcon style={{ fontSize: 16 }} />
                      View Full Details
                    </button>
                  </div>
                </Popup>
              </Marker>
              )
            })}
          </MapContainer>
        </div>
      </main>
      
      {/* Alert Details Modal */}
      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          userLocation={userLocation}
          voteAlert={voteAlert}
          comments={getCommentsForAlert(selectedAlert.id)}
          onAddComment={(comment) => addCommentToAlert(selectedAlert.id, comment)}
        />
      )}
    </div>
  )
}

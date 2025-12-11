import { useEffect, useMemo, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useAlerts } from '../context/AlertsContext'
import FilterListIcon from '@mui/icons-material/FilterList'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SearchIcon from '@mui/icons-material/Search'
import VerifiedIcon from '@mui/icons-material/Verified'
import StraightenIcon from '@mui/icons-material/Straighten'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import AltRouteIcon from '@mui/icons-material/AltRoute'
import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonIcon from '@mui/icons-material/Person'
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
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SendIcon from '@mui/icons-material/Send'

const severityColor = {
  Low: '#2ecc71',
  Medium: '#f39c12',
  High: '#e74c3c',
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function MapController({ onMapReady }) {
  const map = useMap()
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map)
    }
  }, [map, onMapReady])
  return null
}

// Voice Player Component for Alert Popups
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
          audioRef.current.volume = 1.0
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (err) {
        console.error('Audio playback error:', err)
        setError('Could not play audio')
      }
    }
  }
  
  if (!voiceNote) return null
  
  return (
    <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
          } text-white shadow-md`}
        >
          {isPlaying ? (
            <PauseIcon style={{ fontSize: 16 }} />
          ) : (
            <PlayArrowIcon style={{ fontSize: 16 }} />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-purple-700">
            <VolumeUpIcon style={{ fontSize: 14 }} />
            Voice Report
          </div>
          <div className="text-xs text-gray-500">
            {error ? <span className="text-red-500">{error}</span> : (isPlaying ? 'Playing...' : 'Click to listen')}
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={voiceNote}
        preload="auto"
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Audio error:', e)
          setError('Audio failed to load')
        }}
      />
    </div>
  )
}

// Alternate Routes Display Component
function AlternateRoutesDisplay({ routes }) {
  if (!routes || routes.length === 0) return null
  
  return (
    <div className="mt-2 p-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 mb-2">
        <AltRouteIcon style={{ fontSize: 14 }} />
        Alternate Routes Suggested
      </div>
      <div className="space-y-1.5">
        {routes.map((route, idx) => (
          <div key={route.id || idx} className="text-xs bg-white rounded p-1.5 border border-emerald-100">
            <div className="font-medium text-gray-800">
              {route.from} → {route.to}
            </div>
            <div className="text-emerald-600">Via: {route.alternateVia}</div>
            {route.estimatedTime && (
              <div className="text-gray-500">Time: {route.estimatedTime}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Photo Gallery Modal Component
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

// Alert Details Modal Component
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

export default function MapPage() {
  const { alerts, voteAlert, userLocation, setUserLocation, nearbyRadiusMeters, setNearbyRadiusMeters, getCommentsForAlert, addCommentToAlert } = useAlerts()
  const [center, setCenter] = useState([20, 0])
  const [filters, setFilters] = useState({ type: 'All', severity: 'All', verifiedOnly: false, maxDistance: 500, search: '' })
  const [map, setMap] = useState(null)
  const [geoError, setGeoError] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null) // For full-screen modal

  const goToMyLocation = () => {
    setGeoError(null)
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.')
      alert('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserLocation({ lat, lng })
        // Updating center state alone won’t move the map after mount
        // Use the map instance to animate to the location
        if (map) {
          map.flyTo([lat, lng], 15, { duration: 0.75 })
        } else {
          // Fallback: set center state (useful before map instance is ready)
          setCenter([lat, lng])
        }
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setGeoError('Location access denied or unavailable. Please allow location permission.')
        alert('Location access denied or unavailable. Please allow location permission.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = [pos.coords.latitude, pos.coords.longitude]
          setCenter(c)
          setUserLocation({ lat: c[0], lng: c[1] })
          setNearbyRadiusMeters(500)
          setFilters((f) => ({ ...f, maxDistance: 500 }))
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
      if (filters.search && !`${a.description || ''}`.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (userLocation && filters.maxDistance) {
        const d = haversineMeters(userLocation.lat, userLocation.lng, a.lat, a.lng)
        if (d > filters.maxDistance) return false
      }
      return true
    })
  }, [alerts, filters, userLocation])

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto p-3 grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Enhanced Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 sticky top-20">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-200">
              <FilterListIcon className="text-blue-600" />
              <h3 className="text-lg font-bold text-gray-800">Filters</h3>
            </div>

            {/* Stats Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-5">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {filtered.length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Alerts Found</div>
              </div>
            </div>

            {/* Hazard Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🚨 Hazard Type
              </label>
              <select
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              >
                {['All','Potholes','Accident','Floods','Broken Roads','Landslides','Road Closures','Police Checkpoints','Heavy Traffic Jam','Fire on Roadside','Animal Crossing'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⚡ Severity Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'All', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: '🔘' },
                  { value: 'Low', color: 'bg-green-50 text-green-700 border-green-300', icon: '🟢' },
                  { value: 'Medium', color: 'bg-orange-50 text-orange-700 border-orange-300', icon: '🟠' },
                  { value: 'High', color: 'bg-red-50 text-red-700 border-red-300', icon: '🔴' }
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setFilters((f) => ({ ...f, severity: s.value }))}
                    className={`p-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                      filters.severity === s.value
                        ? `${s.color} shadow-md scale-105`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    <div>{s.value}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Only Toggle */}
            <div className="mb-4 bg-blue-50 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="verified"
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <VerifiedIcon className="text-blue-600" style={{ fontSize: 18 }} />
                <span className="text-sm font-semibold text-blue-900">Verified Only</span>
              </label>
            </div>

            {/* Distance Filter */}
            <div className="mb-4">
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                <StraightenIcon style={{ fontSize: 18 }} />
                Max Distance
              </label>
              <div className="relative">
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={100}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters((f) => ({ ...f, maxDistance: Number(e.target.value) }))}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100m</span>
                  <span className="font-bold text-blue-600">{filters.maxDistance}m</span>
                  <span>5km</span>
                </div>
              </div>
            </div>

            {/* Search Filter */}
            <div className="mb-4">
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                <SearchIcon style={{ fontSize: 18 }} />
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search description..."
                />
                <SearchIcon className="absolute left-2.5 top-2.5 text-gray-400" style={{ fontSize: 18 }} />
              </div>
            </div>

            {/* Locate Me Button */}
            <button 
              onClick={goToMyLocation} 
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <MyLocationIcon style={{ fontSize: 20 }} />
              Locate Me
            </button>
            {geoError && <p className="text-xs text-red-600 mt-2 text-center">{geoError}</p>}
          </div>
        </div>

        {/* Map Section */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
            style={{ height: 'calc(100vh - 100px)' }}
          >
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <MapController onMapReady={setMap} />
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {userLocation && (
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={8}
                  pathOptions={{ color: '#2980b9', fillColor: '#3498db', fillOpacity: 0.7 }}
                >
                  <Popup>Your location</Popup>
                </CircleMarker>
              )}
              {filtered.map((a) => (
                <CircleMarker
                  key={a.id}
                  center={[a.lat, a.lng]}
                  radius={10}
                  pathOptions={{ color: severityColor[a.severity] || '#3498db', fillColor: severityColor[a.severity] || '#3498db', fillOpacity: 0.6 }}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">{a.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          a.severity === 'High' ? 'bg-red-100 text-red-700' :
                          a.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>{a.severity}</span>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <PersonIcon style={{ fontSize: 12 }} />
                          {a.contributor}
                        </div>
                        <div className="flex items-center gap-1">
                          <AccessTimeIcon style={{ fontSize: 12 }} />
                          {new Date(a.timestamp).toLocaleString()}
                        </div>
                        {userLocation && (
                          <div className="flex items-center gap-1">
                            <LocationOnIcon style={{ fontSize: 12 }} />
                            {haversineMeters(userLocation.lat, userLocation.lng, a.lat, a.lng).toFixed(0)}m away
                          </div>
                        )}
                      </div>
                      
                      {a.description && (
                        <div className="text-sm text-gray-600 line-clamp-2 border-t border-gray-100 pt-2">
                          {a.description}
                        </div>
                      )}
                      
                      {a.verified && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                          <VerifiedIcon style={{ fontSize: 14 }} />
                          Verified by community
                        </div>
                      )}
                      
                      {/* Quick Vote Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button 
                          onClick={() => voteAlert(a.id, +1)} 
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-semibold transition-all"
                        >
                          <ThumbUpIcon style={{ fontSize: 14 }} />
                          {a.votesUp || 0}
                        </button>
                        <button 
                          onClick={() => voteAlert(a.id, -1)} 
                          className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-semibold transition-all"
                        >
                          <ThumbDownIcon style={{ fontSize: 14 }} />
                          {a.votesDown || 0}
                        </button>
                      </div>
                      
                      {/* View Full Details Button */}
                      <button
                        onClick={() => setSelectedAlert(a)}
                        className="w-full mt-2 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <OpenInFullIcon style={{ fontSize: 16 }} />
                        View Full Details
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
      
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
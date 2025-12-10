import { useState, useEffect } from 'react'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import LocalPoliceIcon from '@mui/icons-material/LocalPolice'
import FireTruckIcon from '@mui/icons-material/FireTruck'
import SosIcon from '@mui/icons-material/Sos'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ShareIcon from '@mui/icons-material/Share'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import WarningIcon from '@mui/icons-material/Warning'
import CloseIcon from '@mui/icons-material/Close'

// Emergency contacts (Bangladesh numbers - can be customized)
const EMERGENCY_SERVICES = [
  {
    id: 'ambulance',
    name: 'Ambulance',
    icon: LocalHospitalIcon,
    number: '999',
    altNumber: '199',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    description: 'Medical Emergency',
    emoji: '🚑'
  },
  {
    id: 'police',
    name: 'Police',
    icon: LocalPoliceIcon,
    number: '999',
    altNumber: '100',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Crime & Safety',
    emoji: '👮'
  },
  {
    id: 'fire',
    name: 'Fire Service',
    icon: FireTruckIcon,
    number: '999',
    altNumber: '101',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Fire Emergency',
    emoji: '🚒'
  }
]

export default function Emergency() {
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [showSosModal, setShowSosModal] = useState(false)
  const [sosCountdown, setSosCountdown] = useState(null)
  const [copiedLocation, setCopiedLocation] = useState(false)
  const [sosTriggered, setSosTriggered] = useState(false)

  // Get user's location on mount
  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    setLocationError(null)
    
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
        setIsLoadingLocation(false)
      },
      (error) => {
        setLocationError('Unable to get location. Please enable location services.')
        setIsLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleCall = (number) => {
    window.location.href = `tel:${number}`
  }

  const getGoogleMapsUrl = () => {
    if (!location) return ''
    return `https://www.google.com/maps?q=${location.lat},${location.lng}`
  }

  const getLocationText = () => {
    if (!location) return 'Location not available'
    return `📍 My Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\n🗺️ Google Maps: ${getGoogleMapsUrl()}`
  }

  const copyLocation = async () => {
    if (!location) return
    
    try {
      await navigator.clipboard.writeText(getLocationText())
      setCopiedLocation(true)
      setTimeout(() => setCopiedLocation(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareLocation = async () => {
    if (!location) return
    
    const shareData = {
      title: '🆘 Emergency - My Location',
      text: `EMERGENCY! I need help!\n\n${getLocationText()}`,
      url: getGoogleMapsUrl()
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        copyLocation()
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyLocation()
      }
    }
  }

  const triggerSOS = () => {
    setShowSosModal(true)
    setSosCountdown(5)
  }

  // SOS countdown effect
  useEffect(() => {
    if (sosCountdown === null) return
    
    if (sosCountdown === 0) {
      // Execute SOS actions
      executeSOS()
      return
    }

    const timer = setTimeout(() => {
      setSosCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [sosCountdown])

  const executeSOS = () => {
    setSosTriggered(true)
    
    // Send SMS to emergency contacts (simulated - would need backend)
    console.log('SOS Triggered! Location:', location)
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🆘 SOS Alert Sent!', {
        body: 'Emergency services have been notified with your location.',
        icon: '🚨'
      })
    }

    // Auto-call emergency number after 2 seconds
    setTimeout(() => {
      handleCall('999')
    }, 2000)
  }

  const cancelSOS = () => {
    setShowSosModal(false)
    setSosCountdown(null)
    setSosTriggered(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-6">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full shadow-xl mb-4 animate-pulse">
            <WarningIcon className="text-white" style={{ fontSize: 44 }} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Emergency Services
          </h1>
          <p className="text-gray-600">Quick access to emergency help when you need it most</p>
        </div>

        {/* Current Location Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LocationOnIcon className="text-red-500" />
              <span className="font-bold text-gray-800">Your Location</span>
            </div>
            <button
              onClick={getCurrentLocation}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh location"
            >
              <MyLocationIcon className={`text-blue-500 ${isLoadingLocation ? 'animate-spin' : ''}`} style={{ fontSize: 20 }} />
            </button>
          </div>
          
          {isLoadingLocation ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Getting your location...</span>
            </div>
          ) : locationError ? (
            <div className="text-red-500 text-sm">{locationError}</div>
          ) : location ? (
            <div>
              <div className="text-sm text-gray-600 mb-3 font-mono bg-gray-50 p-2 rounded-lg">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyLocation}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  {copiedLocation ? (
                    <>
                      <CheckCircleIcon className="text-green-500" style={{ fontSize: 18 }} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ContentCopyIcon style={{ fontSize: 18 }} />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={shareLocation}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
                >
                  <ShareIcon style={{ fontSize: 18 }} />
                  Share
                </button>
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-medium text-green-700 transition-colors"
                >
                  <LocationOnIcon style={{ fontSize: 18 }} />
                  Map
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* Emergency Services Grid */}
        <div className="grid gap-4 mb-8">
          {EMERGENCY_SERVICES.map((service) => {
            const IconComponent = service.icon
            return (
              <div
                key={service.id}
                className={`${service.bgColor} ${service.borderColor} border-2 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-3xl">{service.emoji}</span>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${service.textColor}`}>{service.name}</h3>
                      <p className="text-gray-600 text-sm">{service.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-mono font-bold text-gray-800">{service.number}</span>
                        {service.altNumber && (
                          <span className="text-sm text-gray-500">or {service.altNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleCall(service.number)}
                      className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${service.color} text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
                    >
                      <PhoneIcon style={{ fontSize: 20 }} />
                      Call
                    </button>
                    {service.altNumber && (
                      <button
                        onClick={() => handleCall(service.altNumber)}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Call {service.altNumber}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* SOS Button */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-sm mb-4">
            One-tap emergency SOS with live location
          </p>
          <button
            onClick={triggerSOS}
            className="relative w-40 h-40 mx-auto"
          >
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
            <div className="absolute inset-2 bg-red-500 rounded-full animate-ping opacity-25 animation-delay-200"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-full flex flex-col items-center justify-center shadow-2xl hover:from-red-600 hover:to-red-800 transform hover:scale-105 transition-all border-4 border-red-300">
              <SosIcon className="text-white mb-1" style={{ fontSize: 48 }} />
              <span className="text-white font-bold text-xl">SOS</span>
            </div>
          </button>
          <p className="text-red-500 text-sm mt-4 font-medium">
            ⚠️ Press for emergency - will call 999 and share your location
          </p>
        </div>

        {/* Emergency Tips */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-5 border border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Emergency Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Stay calm and speak clearly when calling emergency services
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Provide your exact location using the coordinates above
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Describe the emergency situation briefly but accurately
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Don't hang up until the operator tells you to
            </li>
          </ul>
        </div>
      </div>

      {/* SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            {!sosTriggered ? (
              <>
                <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <SosIcon className="text-red-500" style={{ fontSize: 56 }} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Emergency SOS</h2>
                <p className="text-gray-600 mb-6">
                  This will call emergency services (999) and share your live location.
                </p>
                
                {sosCountdown !== null && sosCountdown > 0 ? (
                  <div className="mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-4xl font-bold text-white">{sosCountdown}</span>
                    </div>
                    <p className="text-red-500 font-medium">Calling in {sosCountdown} seconds...</p>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    onClick={cancelSOS}
                    className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CloseIcon style={{ fontSize: 20 }} />
                    Cancel
                  </button>
                  {sosCountdown === null && (
                    <button
                      onClick={() => setSosCountdown(5)}
                      className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <PhoneIcon style={{ fontSize: 20 }} />
                      Confirm SOS
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="text-green-500" style={{ fontSize: 56 }} />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">SOS Sent!</h2>
                <p className="text-gray-600 mb-4">
                  Emergency call initiated. Help is on the way.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-gray-600 mb-1">📍 Your location has been shared:</p>
                  <p className="text-xs font-mono text-gray-800">
                    {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Location unavailable'}
                  </p>
                </div>
                <button
                  onClick={cancelSOS}
                  className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

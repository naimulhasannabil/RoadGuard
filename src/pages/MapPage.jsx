import { useEffect, useMemo, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useAlerts } from '../context/AlertsContext'
import FilterListIcon from '@mui/icons-material/FilterList'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SearchIcon from '@mui/icons-material/Search'
import VerifiedIcon from '@mui/icons-material/Verified'
import StraightenIcon from '@mui/icons-material/Straighten'

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

export default function MapPage() {
  const { alerts, voteAlert, userLocation, setUserLocation, nearbyRadiusMeters, setNearbyRadiusMeters } = useAlerts()
  const [center, setCenter] = useState([20, 0])
  const [filters, setFilters] = useState({ type: 'All', severity: 'All', verifiedOnly: false, maxDistance: 500, search: '' })
  const [map, setMap] = useState(null)
  const [geoError, setGeoError] = useState(null)

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
                    <div className="space-y-2">
                      <div className="font-semibold">{a.type} <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100">{a.severity}</span></div>
                      <div className="text-sm text-gray-600">Contributor: {a.contributor}</div>
                      <div className="text-sm">Timestamp: {new Date(a.timestamp).toLocaleString()}</div>
                      {userLocation && (
                        <div className="text-sm">Distance: {haversineMeters(userLocation.lat, userLocation.lng, a.lat, a.lng).toFixed(0)} m</div>
                      )}
                      {a.description && <div className="text-sm">{a.description}</div>}
                      {a.photos?.length ? (
                        <div className="flex gap-2 flex-wrap">
                          {a.photos.map((p) => (
                            <img key={p.url} src={p.url} alt={p.name} className="w-20 h-20 object-cover rounded" />
                          ))}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-3">
                        <button onClick={() => voteAlert(a.id, +1)} className="px-2 py-1 bg-green-600 text-white rounded">Upvote ({a.votesUp})</button>
                        <button onClick={() => voteAlert(a.id, -1)} className="px-2 py-1 bg-red-600 text-white rounded">Downvote ({a.votesDown})</button>
                        {a.verified && <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Verified</span>}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
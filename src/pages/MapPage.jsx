import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { useAlerts } from '../context/AlertsContext'

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
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-1 space-y-3">
          <h3 className="font-semibold">Filters</h3>
          <div>
            <label className="block text-sm">Type</label>
            <select
              className="w-full border rounded p-2"
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              {['All','Potholes','Accident','Floods','Broken Roads','Landslides','Road Closures','Police Checkpoints','Heavy Traffic Jam','Fire on Roadside','Animal Crossing'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Severity</label>
            <select
              className="w-full border rounded p-2"
              value={filters.severity}
              onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
            >
              {['All','Low','Medium','High'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="verified"
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))}
            />
            <label htmlFor="verified">Verified only</label>
          </div>
          <div>
            <label className="block text-sm">Distance (m)</label>
            <input
              type="number"
              min={0}
              className="w-full border rounded p-2"
              value={filters.maxDistance}
              onChange={(e) => setFilters((f) => ({ ...f, maxDistance: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className="block text-sm">Search (description)</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="e.g., near bridge"
            />
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="flex items-center justify-end gap-3 mb-2">
            {geoError && <span className="text-sm text-red-600">{geoError}</span>}
            <button onClick={goToMyLocation} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
              Locate Me
            </button>
          </div>
          <div className="w-full">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: 'calc(100vh - 64px)', width: '100%' }}
              whenCreated={setMap}
            >
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
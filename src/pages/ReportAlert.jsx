import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'
import WarningIcon from '@mui/icons-material/Warning'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const HAZARD_TYPES = [
  { value: 'Potholes', icon: '🕳️', color: 'from-gray-500 to-gray-600' },
  { value: 'Accident', icon: '🚨', color: 'from-red-500 to-red-600' },
  { value: 'Floods', icon: '🌊', color: 'from-blue-500 to-blue-600' },
  { value: 'Broken Roads', icon: '🚧', color: 'from-orange-500 to-orange-600' },
  { value: 'Landslides', icon: '⛰️', color: 'from-yellow-700 to-yellow-800' },
  { value: 'Road Closures', icon: '🚫', color: 'from-red-600 to-red-700' },
  { value: 'Police Checkpoints', icon: '👮', color: 'from-blue-600 to-blue-700' },
  { value: 'Heavy Traffic Jam', icon: '🚗', color: 'from-purple-500 to-purple-600' },
  { value: 'Fire on Roadside', icon: '🔥', color: 'from-orange-600 to-red-600' },
  { value: 'Animal Crossing', icon: '🦌', color: 'from-green-600 to-green-700' }
]
const SEVERITIES = [
  { value: 'Low', color: 'from-green-500 to-green-600', icon: '🟢' },
  { value: 'Medium', color: 'from-orange-500 to-orange-600', icon: '🟠' },
  { value: 'High', color: 'from-red-500 to-red-600', icon: '🔴' }
]

export default function ReportAlert() {
  const navigate = useNavigate()
  const { addAlert } = useAlerts()
  const [form, setForm] = useState({
    type: '',
    severity: '',
    description: '',
    photos: [],
    lat: null,
    lng: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude })),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  const onPhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    setForm(f => ({ ...f, photos: files }))
  }

  const removePhoto = (index) => {
    setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      addAlert({
        type: form.type,
        severity: form.severity,
        description: form.description,
        photos: form.photos,
        lat: form.lat,
        lng: form.lng,
        contributor: 'You',
      })
      setIsSubmitting(false)
      navigate('/')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full shadow-xl mb-4">
            <WarningIcon className="text-white" style={{ fontSize: 36 }} />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Report Road Hazard
          </h2>
          <p className="text-gray-600 text-lg">Help keep our roads safe for everyone</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Hazard Type Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <WarningIcon className="text-orange-500" />
              Hazard Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {HAZARD_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    form.type === t.value
                      ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-lg`
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <div className={`text-xs font-semibold ${
                    form.type === t.value ? 'text-white' : 'text-gray-700'
                  }`}>
                    {t.value}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <label className="block text-lg font-bold text-gray-800 mb-4">Severity Level</label>
            <div className="grid grid-cols-3 gap-4">
              {SEVERITIES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                  className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    form.severity === s.value
                      ? `bg-gradient-to-br ${s.color} text-white border-transparent shadow-lg`
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  <div className="text-4xl mb-2">{s.icon}</div>
                  <div className={`text-lg font-bold ${
                    form.severity === s.value ? 'text-white' : 'text-gray-700'
                  }`}>
                    {s.value}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <label className="block text-lg font-bold text-gray-800 mb-3">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
              rows={4}
              placeholder="Describe the hazard in detail (e.g., Large pothole near bridge, causing traffic delays...)"
            />
          </div>

          {/* Photos Upload */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <PhotoCameraIcon className="text-orange-500" />
              Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onPhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <PhotoCameraIcon className="text-gray-400 mx-auto mb-2" style={{ fontSize: 48 }} />
                <p className="text-gray-600 font-semibold">Click to upload photos</p>
                <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</p>
              </label>
            </div>
            {form.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {form.photos.map((f, idx) => {
                  const url = URL.createObjectURL(f)
                  return (
                    <div key={url} className="relative group">
                      <img src={url} alt={f.name} className="w-full h-32 object-cover rounded-xl shadow-md" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Location Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3">
              <LocationOnIcon className="text-blue-600" style={{ fontSize: 32 }} />
              <div>
                <div className="text-sm font-semibold text-blue-900">Current Location</div>
                <div className="text-blue-700">
                  {form.lat && form.lng ? (
                    <span className="flex items-center gap-2">
                      <CheckCircleIcon style={{ fontSize: 18 }} />
                      {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Detecting location...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !form.type || !form.severity}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting Alert...
              </>
            ) : (
              <>
                <SendIcon />
                Submit Alert
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
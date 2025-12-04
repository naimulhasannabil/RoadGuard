import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'

const HAZARD_TYPES = [
  'Potholes','Accident','Floods','Broken Roads','Landslides','Road Closures','Police Checkpoints',
  'Heavy Traffic Jam','Fire on Roadside','Animal Crossing'
]
const SEVERITIES = ['Low', 'Medium', 'High']

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

  const onSubmit = async (e) => {
    e.preventDefault()
    addAlert({
      type: form.type,
      severity: form.severity,
      description: form.description,
      photos: form.photos,
      lat: form.lat,
      lng: form.lng,
      contributor: 'You',
    })
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Report Hazard</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Hazard Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Select type</option>
            {HAZARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-1">Severity</label>
          <select
            value={form.severity}
            onChange={(e) => setForm(f => ({ ...f, severity: e.target.value }))}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Select severity</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Short description"
          />
        </div>

        <div>
          <label className="block mb-1">Photos</label>
          <input type="file" multiple accept="image/*" onChange={onPhotoChange} className="w-full" />
          <div className="flex gap-2 flex-wrap mt-2">
            {form.photos.map((f) => {
              const url = URL.createObjectURL(f)
              return <img key={url} src={url} alt={f.name} className="w-20 h-20 object-cover rounded" />
            })}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Location: {form.lat && form.lng ? `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}` : 'Detecting...'}
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Submit Alert
        </button>
      </form>
    </div>
  )
}
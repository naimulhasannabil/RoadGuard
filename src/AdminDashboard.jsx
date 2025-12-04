import { useMemo, useState, useEffect } from 'react'

const ALERT_TYPES = [
  'Accident',
  'Pothole',
  'Flood',
  'Broken Road',
  'Landslide',
  'Road Closure',
  'Police Checkpoint',
]

const SEVERITIES = ['Low', 'Medium', 'High']

const initialUsers = [
  { id: 'u1', name: 'Alice Khan', reports: 12, verified: 8, banned: false },
  { id: 'u2', name: 'Bob Iqbal', reports: 6, verified: 2, banned: false },
  { id: 'u3', name: 'Sara Malik', reports: 20, verified: 15, banned: false },
]

const initialAlerts = [
  {
    id: 'a1',
    type: 'Accident',
    severity: 'High',
    status: 'active',
    reporterId: 'u3',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    upvotes: 12,
    downvotes: 2,
    images: ['https://via.placeholder.com/120x80?text=Accident'],
    location: { lat: 24.8615, lng: 67.0099, label: 'Shahrah-e-Faisal' },
  },
  {
    id: 'a2',
    type: 'Pothole',
    severity: 'Medium',
    status: 'verified',
    reporterId: 'u1',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    upvotes: 22,
    downvotes: 1,
    images: ['https://via.placeholder.com/120x80?text=Pothole'],
    location: { lat: 24.9065, lng: 67.0803, label: 'Korangi 4' },
  },
  {
    id: 'a3',
    type: 'Flood',
    severity: 'High',
    status: 'active',
    reporterId: 'u2',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    upvotes: 5,
    downvotes: 0,
    images: [],
    location: { lat: 24.938, lng: 67.1203, label: 'Gulshan 13D' },
  },
]

const defaultTTL = {
  'Accident:High': 360,
  'Accident:Medium': 240,
  'Accident:Low': 120,
  'Pothole:High': 1440,
  'Pothole:Medium': 720,
  'Pothole:Low': 480,
  'Flood:High': 720,
  'Flood:Medium': 480,
  'Flood:Low': 240,
  'Broken Road:High': 1440,
  'Broken Road:Medium': 720,
  'Broken Road:Low': 480,
  'Landslide:High': 720,
  'Landslide:Medium': 480,
  'Landslide:Low': 240,
  'Road Closure:High': 720,
  'Road Closure:Medium': 360,
  'Road Closure:Low': 240,
  'Police Checkpoint:High': 240,
  'Police Checkpoint:Medium': 180,
  'Police Checkpoint:Low': 120,
}

function AdminDashboard() {
  const [users, setUsers] = useState(initialUsers)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [ttl, setTtl] = useState(defaultTTL)
  const [tab, setTab] = useState('alerts')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editingAlert, setEditingAlert] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const updated = alerts.map((a) => {
      if (a.status === 'verified') return a
      const key = `${a.type}:${a.severity}`
      const minutes = ttl[key] ?? 240
      const ageMin = (Date.now() - new Date(a.createdAt).getTime()) / (60 * 1000)
      return { ...a, status: ageMin > minutes ? 'expired' : 'active' }
    })
    setAlerts(updated)
  }, [ttl])

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const statusOk = statusFilter === 'all' ? true : a.status === statusFilter
      const typeOk = typeFilter === 'all' ? true : a.type === typeFilter
      const searchOk =
        !search ||
        a.location?.label?.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase())
      return statusOk && typeOk && searchOk
    })
  }, [alerts, statusFilter, typeFilter, search])

  const reporterName = (id) => users.find((u) => u.id === id)?.name || '—'

  const markVerified = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'verified' } : a)))
  }

  const markExpired = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'expired' } : a)))
  }

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const openEdit = (alert) => setEditingAlert(alert)
  const closeEdit = () => setEditingAlert(null)

  const saveEdit = () => {
    setAlerts((prev) => prev.map((a) => (a.id === editingAlert.id ? editingAlert : a)))
    closeEdit()
  }

  const toggleBan = (userId) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, banned: !u.banned } : u)))
  }

  const updateTTL = (key, minutes) => {
    setTtl((prev) => ({ ...prev, [key]: Math.max(10, Number(minutes) || 10) }))
  }

  const recalcExpiry = () => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.status === 'verified') return a
        const key = `${a.type}:${a.severity}`
        const minutes = ttl[key] ?? 240
        const ageMin = (Date.now() - new Date(a.createdAt).getTime()) / (60 * 1000)
        return { ...a, status: ageMin > minutes ? 'expired' : 'active' }
      }),
    )
  }

  const analytics = useMemo(() => {
    const byType = {}
    const bySeverity = {}
    const contributorCounts = {}
    for (const a of alerts) {
      byType[a.type] = (byType[a.type] || 0) + 1
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1
      contributorCounts[a.reporterId] = (contributorCounts[a.reporterId] || 0) + 1
    }
    const topContributors = Object.entries(contributorCounts)
      .map(([uid, count]) => ({ uid, name: reporterName(uid), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    return { byType, bySeverity, topContributors }
  }, [alerts])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">RoadGuard Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Manage alerts, users, analytics, and TTL settings</p>
        </div>
      </header>

      <nav className="max-w-7xl mx-auto px-4 pt-4 flex gap-2">
        {[
          { id: 'alerts', label: 'Alerts' },
          { id: 'users', label: 'Users' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'settings', label: 'Settings' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded border ${
              tab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'alerts' && (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-xs text-gray-600">Status</label>
                <select className="border rounded px-2 py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="verified">Verified</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Type</label>
                <select className="border rounded px-2 py-1" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">All</option>
                  {ALERT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-600">Search</label>
                <input
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Search by road/area or type"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="px-3 py-2 rounded border bg-gray-100 hover:bg-gray-200" onClick={recalcExpiry}>
                Recalculate Expiry
              </button>
            </div>

            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Severity</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Reporter</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Votes</th>
                    <th className="text-left p-2">Images</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-2">{a.type}</td>
                      <td className="p-2">{a.severity}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            a.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : a.status === 'verified'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-2">{reporterName(a.reporterId)}</td>
                      <td className="p-2">{a.location?.label || `${a.location?.lat},${a.location?.lng}`}</td>
                      <td className="p-2">
                        <span className="text-green-700">+{a.upvotes}</span> / <span className="text-red-700">-{a.downvotes}</span>
                      </td>
                      <td className="p-2">{a.images.length}</td>
                      <td className="p-2">{new Date(a.createdAt).toLocaleString()}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button className="px-2 py-1 border rounded hover:bg-gray-100" onClick={() => openEdit(a)}>
                            Edit
                          </button>
                          <button className="px-2 py-1 border rounded hover:bg-gray-100" onClick={() => markVerified(a.id)}>
                            Verify
                          </button>
                          <button className="px-2 py-1 border rounded hover:bg-gray-100" onClick={() => markExpired(a.id)}>
                            Expire
                          </button>
                          <button className="px-2 py-1 border rounded text-red-700 hover:bg-red-50" onClick={() => removeAlert(a.id)}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAlerts.length === 0 && (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan={9}>
                        No alerts match current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {editingAlert && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
                <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">Edit Alert</h2>
                    <button className="text-gray-600" onClick={closeEdit}>
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Type</label>
                      <select
                        className="border rounded px-2 py-1 w-full"
                        value={editingAlert.type}
                        onChange={(e) => setEditingAlert({ ...editingAlert, type: e.target.value })}
                      >
                        {ALERT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Severity</label>
                      <select
                        className="border rounded px-2 py-1 w-full"
                        value={editingAlert.severity}
                        onChange={(e) => setEditingAlert({ ...editingAlert, severity: e.target.value })}
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600">Location label</label>
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editingAlert.location?.label || ''}
                        onChange={(e) =>
                          setEditingAlert({
                            ...editingAlert,
                            location: { ...editingAlert.location, label: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <button className="px-3 py-2 border rounded hover:bg-gray-100" onClick={closeEdit}>
                      Cancel
                    </button>
                    <button className="px-3 py-2 border rounded bg-blue-600 text-white" onClick={saveEdit}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'users' && (
          <section className="space-y-4">
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Reports</th>
                    <th className="text-left p-2">Verified</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-2">{u.name}</td>
                      <td className="p-2">{u.reports}</td>
                      <td className="p-2">{u.verified}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${u.banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          className={`px-2 py-1 border rounded ${u.banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                          onClick={() => toggleBan(u.id)}
                        >
                          {u.banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'analytics' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-3">
              <h3 className="font-semibold mb-2">Alerts by Type</h3>
              <ul className="space-y-1 text-sm">
                {ALERT_TYPES.map((t) => (
                  <li key={t} className="flex justify-between">
                    <span>{t}</span>
                    <span className="font-medium">{analytics.byType[t] || 0}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-semibold mb-2">Severity Distribution</h3>
              <ul className="space-y-1 text-sm">
                {SEVERITIES.map((s) => (
                  <li key={s} className="flex justify-between">
                    <span>{s}</span>
                    <span className="font-medium">{analytics.bySeverity[s] || 0}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-semibold mb-2">Top Contributors</h3>
              <ul className="space-y-1 text-sm">
                {analytics.topContributors.map((c) => (
                  <li key={c.uid} className="flex justify-between">
                    <span>{c.name}</span>
                    <span className="font-medium">{c.count}</span>
                  </li>
                ))}
                {analytics.topContributors.length === 0 && <li className="text-gray-500">No contributors yet</li>}
              </ul>
            </div>
          </section>
        )}

        {tab === 'settings' && (
          <section className="space-y-4">
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Severity</th>
                    <th className="text-left p-2">TTL (minutes)</th>
                  </tr>
                </thead>
                <tbody>
                  {ALERT_TYPES.map((t) =>
                    SEVERITIES.map((s) => {
                      const key = `${t}:${s}`
                      return (
                        <tr key={key} className="border-t">
                          <td className="p-2">{t}</td>
                          <td className="p-2">{s}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={10}
                              className="border rounded px-2 py-1 w-28"
                              value={ttl[key] ?? 240}
                              onChange={(e) => updateTTL(key, e.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    }),
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button className="px-3 py-2 border rounded bg-blue-600 text-white" onClick={recalcExpiry}>
                Apply & Recalculate
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
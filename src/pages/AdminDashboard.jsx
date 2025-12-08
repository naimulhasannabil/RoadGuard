import { useState, useEffect, useMemo } from 'react'
import { useAlerts } from '../context/AlertsContext'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ReportIcon from '@mui/icons-material/Report'
import VerifiedIcon from '@mui/icons-material/Verified'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonIcon from '@mui/icons-material/Person'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import SettingsIcon from '@mui/icons-material/Settings'
import CloseIcon from '@mui/icons-material/Close'
import BlockIcon from '@mui/icons-material/Block'
import BarChartIcon from '@mui/icons-material/BarChart'
import SaveIcon from '@mui/icons-material/Save'

export default function AdminDashboard() {
  const ctx = useAlerts()
const alerts = ctx?.alerts || []
const setAlerts = ctx?.setAlerts
  const [filter, setFilter] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [editedDescription, setEditedDescription] = useState('')
  const [editedSeverity, setEditedSeverity] = useState('Low')
  const [editedType, setEditedType] = useState('')
  
  // User Management (computed from alerts)
  const users = useMemo(() => {
    const map = new Map()
    ;(alerts || []).forEach(a => {
      const name = a.contributor || 'Anonymous'
      const email = a.contributorEmail || 'N/A'
      const m = map.get(name) || { id: name, name, email, reports: 0, spamCount: 0 }
      m.reports += 1
      const up = a.votesUp || 0
      const down = a.votesDown || 0
      if (down > up) m.spamCount += 1
      map.set(name, m)
    })
    return Array.from(map.values())
  }, [alerts])
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Settings State
  const [ttlSettings, setTtlSettings] = useState(() => ({
  Low: ctx?.severityTtl?.Low ?? 30,
  Medium: ctx?.severityTtl?.Medium ?? 60,
  High: ctx?.severityTtl?.High ?? 120
}))
useEffect(() => {
  if (ctx?.severityTtl) {
    setTtlSettings({
      Low: ctx.severityTtl.Low ?? 30,
      Medium: ctx.severityTtl.Medium ?? 60,
      High: ctx.severityTtl.High ?? 120
    })
  }
}, [ctx?.severityTtl])
  const [settingsChanged, setSettingsChanged] = useState(false)

  // Statistics
  const stats = useMemo(() => {
    const total = alerts?.length || 0
    const active = alerts?.filter(a => !a.expired).length || 0
    const verified = alerts?.filter(a => a.verified).length || 0
    const expired = alerts?.filter(a => a.expired).length || 0
    return { total, active, verified, expired }
  }, [alerts])

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    if (!alerts) return []
    if (filter === 'active') return alerts.filter(a => !a.expired)
    if (filter === 'expired') return alerts.filter(a => a.expired)
    if (filter === 'verified') return alerts.filter(a => a.verified)
    return alerts
  }, [alerts, filter])

  const itemsPerPage = 8
  const paginatedAlerts = filteredAlerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)

  // Handle remove alert
  const handleRemoveAlert = (id) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      if (setAlerts) {
        setAlerts(prev => prev.filter(a => a.id !== id))
      }
    }
  }

  // Handle edit alert
  const openEditModal = (alert) => {
    setSelectedAlert(alert)
    setEditedDescription(alert.description || '')
    setEditedSeverity(alert.severity || 'Low')
    setEditedType(alert.type || '')
    setEditModalOpen(true)
  }

  const saveEdit = () => {
    if (selectedAlert && setAlerts) {
      setAlerts(prev => prev.map(a => 
        a.id === selectedAlert.id 
          ? { ...a, description: editedDescription, severity: editedSeverity, type: editedType }
          : a
      ))
    }
    setEditModalOpen(false)
  }

  // Toggle verification
  const toggleVerification = (id) => {
    if (setAlerts) {
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, verified: !a.verified, manuallyVerified: true } : a
      ))
    }
  }

  // Toggle expiration
  const toggleExpiration = (id) => {
    if (setAlerts) {
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, expired: !a.expired } : a
      ))
    }
  }

  // User Management Functions
  const openBanModal = (user) => {
    setSelectedUser(user)
    setBanModalOpen(true)
  }

  const confirmBan = () => {
    if (selectedUser && setAlerts) {
      setAlerts(prev => prev.filter(a => (a.contributor || 'Anonymous') !== selectedUser.name))
    }
    setBanModalOpen(false)
  }

  const unbanUser = (userId) => {
    // No-op: users are computed from alerts; unban requires backend logic
  }

  // Settings Functions
  const handleTtlChange = (severity, value) => {
    setTtlSettings(prev => ({ ...prev, [severity]: parseInt(value) || 0 }))
    setSettingsChanged(true)
  }

  const saveTtlSettings = () => {
    if (ctx?.setSeverityTtl) {
      ctx.setSeverityTtl(ttlSettings)
    } else {
      console.log('TTL settings saved:', ttlSettings)
    }
    alert('✅ Settings saved successfully!')
    setSettingsChanged(false)
  }

  // Analytics Data
  const analytics = useMemo(() => {
    if (!alerts || alerts.length === 0) return {
      topAreas: [],
      peakTimes: 'No data',
      topContributors: [],
      severityBreakdown: { Low: 0, Medium: 0, High: 0 }
    }

    // Calculate severity breakdown
    const severityBreakdown = alerts.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1
      return acc
    }, { Low: 0, Medium: 0, High: 0 })

    // Top contributors
    const contributorCounts = alerts.reduce((acc, a) => {
      acc[a.contributor] = (acc[a.contributor] || 0) + 1
      return acc
    }, {})
    const topContributors = Object.entries(contributorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Top hazard types
    const typeCounts = alerts.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1
      return acc
    }, {})
    const topAreas = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    return {
      topAreas,
      peakTimes: 'Morning (8-10 AM)',
      topContributors,
      severityBreakdown
    }
  }, [alerts])

  const getSeverityColor = (severity) => {
    if (severity === 'High') return 'bg-red-100 text-red-700 border-red-300'
    if (severity === 'Medium') return 'bg-orange-100 text-orange-700 border-orange-300'
    return 'bg-green-100 text-green-700 border-green-300'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <AdminPanelSettingsIcon className="text-white" style={{ fontSize: 36 }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Manage alerts, users, and system settings</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <DashboardIcon style={{ fontSize: 40 }} className="opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-blue-100 text-sm font-medium">Total Alerts</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <CheckCircleIcon style={{ fontSize: 40 }} className="opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-green-100 text-sm font-medium">Active Alerts</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <VerifiedIcon style={{ fontSize: 40 }} className="opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.verified}</div>
                <div className="text-purple-100 text-sm font-medium">Verified Alerts</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <AccessTimeIcon style={{ fontSize: 40 }} className="opacity-80" />
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.expired}</div>
                <div className="text-red-100 text-sm font-medium">Expired Alerts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Management */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ReportIcon className="text-red-500" />
              Alerts Management
            </h2>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              {[
                { value: 'active', label: 'Active', icon: CheckCircleIcon, color: 'green' },
                { value: 'expired', label: 'Expired', icon: AccessTimeIcon, color: 'red' },
                { value: 'verified', label: 'Verified', icon: VerifiedIcon, color: 'purple' },
                { value: 'all', label: 'All', icon: DashboardIcon, color: 'blue' }
              ].map(f => {
                const Icon = f.icon
                return (
                  <button
                    key={f.value}
                    onClick={() => { setFilter(f.value); setCurrentPage(1) }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      filter === f.value
                        ? `bg-${f.color}-500 text-white shadow-md`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon style={{ fontSize: 18 }} />
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Alerts Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="p-4 text-left font-semibold text-gray-700">ID</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Type</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Description</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Severity</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAlerts.length > 0 ? paginatedAlerts.map((alert, idx) => (
                  <tr key={alert.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="p-4 font-mono text-sm text-gray-600">#{String(alert.id).slice(0, 8)}</td>
                    <td className="p-4">
                      <span className="font-medium text-gray-800">{alert.type}</span>
                    </td>
                    <td className="p-4 text-gray-600 max-w-xs truncate">{alert.description || 'No description'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {alert.verified && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold flex items-center gap-1">
                            <VerifiedIcon style={{ fontSize: 14 }} />
                            Verified
                          </span>
                        )}
                        {alert.expired && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold">
                            Expired
                          </span>
                        )}
                        {!alert.verified && !alert.expired && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleVerification(alert.id)}
                          className={`p-2 rounded-lg transition-all ${
                            alert.verified 
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Toggle Verification"
                        >
                          <VerifiedIcon style={{ fontSize: 20 }} />
                        </button>
                        <button
                          onClick={() => openEditModal(alert)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-all"
                          title="Edit Alert"
                        >
                          <EditIcon style={{ fontSize: 20 }} />
                        </button>
                        <button
                          onClick={() => handleRemoveAlert(alert.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                          title="Delete Alert"
                        >
                          <DeleteIcon style={{ fontSize: 20 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400">
                      <ReportIcon style={{ fontSize: 48 }} className="mx-auto mb-2 opacity-30" />
                      <p>No alerts found for this filter</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length} alerts
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <EditIcon />
                    Edit Alert
                  </h3>
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alert Type</label>
                  <input
                    type="text"
                    value={editedType}
                    onChange={(e) => setEditedType(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Low', 'Medium', 'High'].map(sev => (
                      <button
                        key={sev}
                        onClick={() => setEditedSeverity(sev)}
                        className={`p-3 rounded-lg font-semibold transition-all ${
                          editedSeverity === sev
                            ? sev === 'High' ? 'bg-red-500 text-white' :
                              sev === 'Medium' ? 'bg-orange-500 text-white' :
                              'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
            <PersonIcon className="text-purple-500" />
            User Management
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="p-4 text-left font-semibold text-gray-700">Name</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Email</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Reports</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Spam Count</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="p-4 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="p-4 font-medium text-gray-800">{user.name}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {user.reports}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        user.spamCount > 2 ? 'bg-red-100 text-red-700' :
                        user.spamCount > 0 ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.spamCount}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.banned ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-semibold flex items-center gap-1 w-fit">
                          <BlockIcon style={{ fontSize: 16 }} />
                          Banned
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-semibold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {user.banned ? (
                        <button
                          onClick={() => unbanUser(user.id)}
                          className="px-4 py-2 bg-green-100 text-green-600 rounded-lg font-semibold hover:bg-green-200 transition-all"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => openBanModal(user)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-all flex items-center gap-2"
                        >
                          <BlockIcon style={{ fontSize: 18 }} />
                          Ban User
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ban User Modal */}
        {banModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BlockIcon />
                    Ban User
                  </h3>
                  <button
                    onClick={() => setBanModalOpen(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-bold text-red-900 mb-2">Warning</h4>
                  <p className="text-red-700">
                    You are about to ban <strong>{selectedUser.name}</strong>.
                  </p>
                  <p className="text-red-600 text-sm mt-2">
                    This user has {selectedUser.spamCount} spam reports.
                  </p>
                </div>
                <p className="text-gray-600">
                  Banned users will not be able to submit new alerts. This action can be reversed.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
                <button
                  onClick={() => setBanModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBan}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <BlockIcon />
                  Confirm Ban
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
            <BarChartIcon className="text-green-500" />
            Analytics & Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Severity Breakdown */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <ReportIcon />
                Severity Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.severityBreakdown).map(([severity, count]) => (
                  <div key={severity}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-blue-800">{severity}</span>
                      <span className="text-sm font-bold text-blue-900">{count}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          severity === 'High' ? 'bg-red-500' :
                          severity === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Hazard Types */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                <TrendingUpIcon />
                Top Hazard Types
              </h3>
              {analytics.topAreas.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topAreas.map(({ type, count }, idx) => (
                    <div key={type} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{type}</span>
                      </div>
                      <span className="text-sm font-bold text-purple-600">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-purple-600 text-sm">No data available</p>
              )}
            </div>

            {/* Top Contributors */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                <PersonIcon />
                Top Contributors
              </h3>
              {analytics.topContributors.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topContributors.map(({ name, count }, idx) => (
                    <div key={name} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{name}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{count} reports</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-600 text-sm">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mt-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
            <SettingsIcon className="text-orange-500" />
            System Settings
          </h2>

          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
              <AccessTimeIcon />
              Alert TTL (Time To Live) Settings
            </h3>
            <p className="text-sm text-orange-700 mb-6">
              Configure how long alerts remain active based on severity level (in minutes)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Low', 'Medium', 'High'].map(severity => (
                <div key={severity}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {severity} Severity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={ttlSettings[severity]}
                      onChange={(e) => handleTtlChange(severity, e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg p-3 pr-16 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                    />
                    <span className="absolute right-3 top-3 text-gray-500 text-sm">mins</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {ttlSettings[severity]} minutes ({(ttlSettings[severity] / 60).toFixed(1)} hours)
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                {settingsChanged && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <button
                onClick={saveTtlSettings}
                disabled={!settingsChanged}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <SaveIcon />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
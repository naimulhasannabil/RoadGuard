import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'
import { useAuth } from '../context/AuthContext'

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard'
import ReportIcon from '@mui/icons-material/Report'
import HistoryIcon from '@mui/icons-material/History'
import SettingsIcon from '@mui/icons-material/Settings'
import SearchIcon from '@mui/icons-material/Search'
import VerifiedIcon from '@mui/icons-material/Verified'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import BlockIcon from '@mui/icons-material/Block'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ImageIcon from '@mui/icons-material/Image'
import CloseIcon from '@mui/icons-material/Close'
import MenuIcon from '@mui/icons-material/Menu'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SaveIcon from '@mui/icons-material/Save'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import LocalPoliceIcon from '@mui/icons-material/LocalPolice'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import MicIcon from '@mui/icons-material/Mic'
import NotificationsIcon from '@mui/icons-material/Notifications'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import RefreshIcon from '@mui/icons-material/Refresh'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LogoutIcon from '@mui/icons-material/Logout'
import MapIcon from '@mui/icons-material/Map'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlwMDA3IiwiYSI6ImNtNDBpNW0yNDA1OGkyanM2MmgxbDkxNHMifQ.3lQJD9lTZXpfXcP7fRMaOA'

const getPhotoUrl = (photo) => {
  if (!photo) return null
  if (typeof photo === 'string') return photo
  if (photo instanceof Blob || photo instanceof File) return URL.createObjectURL(photo)
  return photo.url || photo.preview || null
}

const getTimeAgo = (date) => {
  if (!date) return 'Unknown'
  const diff = Math.floor((new Date() - new Date(date)) / 1000 / 60)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, signOut, loading: authLoading } = useAuth()
  
  const ctx = useAlerts()
  const alerts = ctx?.alerts || []
  const setAlerts = ctx?.setAlerts
  const getCommentsForAlert = ctx?.getCommentsForAlert

  const [activeTab, setActiveTab] = useState('alerts')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [showSidebar, setShowSidebar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [playingAudio, setPlayingAudio] = useState(null)
  const [editModal, setEditModal] = useState({ open: false, data: {} })
  const [actionModal, setActionModal] = useState({ open: false, type: null, alert: null })
  const [ttlSettings, setTtlSettings] = useState(() => {
    const saved = localStorage.getItem('adminTtlSettings')
    return saved ? JSON.parse(saved) : { Low: 30, Medium: 60, High: 120 }
  })
  const [settingsChanged, setSettingsChanged] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Functional Settings State
  const [alertSettings, setAlertSettings] = useState(() => {
    const saved = localStorage.getItem('adminAlertSettings')
    return saved ? JSON.parse(saved) : { verifiedBoostPercent: 50 }
  })
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('adminNotificationSettings')
    return saved ? JSON.parse(saved) : {
      pushNotifications: true,
      soundEnabled: true,
      digestMode: 'realtime'
    }
  })
  const [displaySettings, setDisplaySettings] = useState(() => {
    const saved = localStorage.getItem('adminDisplaySettings')
    return saved ? JSON.parse(saved) : {
      showThumbnails: true,
      autoRefresh: true,
      refreshInterval: 30
    }
  })
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const audioRef = useRef(null)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Handle logout
  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    navigate('/admin-login')
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin-login')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (ctx?.severityTtl) setTtlSettings(ctx.severityTtl)
  }, [ctx?.severityTtl])

  // Save settings to localStorage when they change
  const saveAllSettings = () => {
    localStorage.setItem('adminTtlSettings', JSON.stringify(ttlSettings))
    localStorage.setItem('adminAlertSettings', JSON.stringify(alertSettings))
    localStorage.setItem('adminNotificationSettings', JSON.stringify(notificationSettings))
    localStorage.setItem('adminDisplaySettings', JSON.stringify(displaySettings))
    ctx?.setSeverityTtl?.(ttlSettings)
    setSettingsChanged(false)
  }

  // Auto-refresh effect
  useEffect(() => {
    if (!displaySettings.autoRefresh) return
    const interval = setInterval(() => {
      // Trigger a re-fetch or refresh action
      if (ctx?.refreshAlerts) ctx.refreshAlerts()
    }, displaySettings.refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [displaySettings.autoRefresh, displaySettings.refreshInterval, ctx])

  // Push Notifications - Request permission and show notifications
  const [notificationPermission, setNotificationPermission] = useState(Notification?.permission || 'default')
  const [previousAlertIds, setPreviousAlertIds] = useState(new Set())

  // Request notification permission when push notifications are enabled
  useEffect(() => {
    if (notificationSettings.pushNotifications && Notification?.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission)
      })
    }
  }, [notificationSettings.pushNotifications])

  // Show notification for new alerts
  const showPushNotification = (alert) => {
    if (!notificationSettings.pushNotifications) return
    if (notificationPermission !== 'granted') return

    const notification = new Notification(`🚨 ${alert.type}`, {
      body: `${alert.severity} priority alert at ${alert.location || 'Unknown location'}`,
      icon: '/favicon.ico',
      tag: alert.id, // Prevents duplicate notifications
      requireInteraction: alert.severity === 'High'
    })

    // Play sound if enabled
    if (notificationSettings.soundEnabled && audioRef.current) {
      audioRef.current.src = '/notification.mp3'
      audioRef.current.play().catch(() => {}) // Ignore autoplay errors
    }

    notification.onclick = () => {
      window.focus()
      setActiveTab('alerts')
      setSelectedAlert(alert)
      notification.close()
    }

    // Auto-close after 5 seconds for non-high priority
    if (alert.severity !== 'High') {
      setTimeout(() => notification.close(), 5000)
    }
  }

  // Watch for new alerts and trigger notifications
  useEffect(() => {
    if (!alerts.length) return
    
    const currentIds = new Set(alerts.map(a => a.id))
    
    // Find new alerts (ids that weren't in previous set)
    alerts.forEach(alert => {
      if (!previousAlertIds.has(alert.id) && previousAlertIds.size > 0) {
        showPushNotification(alert)
      }
    })
    
    setPreviousAlertIds(currentIds)
  }, [alerts, notificationSettings.pushNotifications, notificationSettings.soundEnabled, notificationPermission])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editModal.open || actionModal.open) return
      if (e.key === 'v' && selectedAlert) handleVerify(selectedAlert.id)
      if (e.key === 'd' && selectedAlert) handleDelete(selectedAlert.id)
      if (e.key === 'e' && selectedAlert) openEditModal(selectedAlert)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAlert, editModal.open, actionModal.open])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get notification items
  const notifications = useMemo(() => {
    const items = []
    const highPriorityAlerts = alerts.filter(a => a.severity === 'High' && !a.verified)
    const unverifiedAlerts = alerts.filter(a => !a.verified)
    const recentAlerts = [...alerts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5)
    
    if (highPriorityAlerts.length > 0) {
      items.push({ type: 'warning', title: `${highPriorityAlerts.length} High Priority Alert${highPriorityAlerts.length > 1 ? 's' : ''}`, desc: 'Requires immediate attention', alerts: highPriorityAlerts, icon: 'high' })
    }
    if (unverifiedAlerts.length > 0) {
      items.push({ type: 'info', title: `${unverifiedAlerts.length} Unverified Alert${unverifiedAlerts.length > 1 ? 's' : ''}`, desc: 'Pending verification', alerts: unverifiedAlerts, icon: 'unverified' })
    }
    recentAlerts.forEach(alert => {
      items.push({ type: 'alert', title: alert.type, desc: alert.location || 'Unknown location', time: getTimeAgo(alert.timestamp), alert, icon: 'recent' })
    })
    return items
  }, [alerts])

  const stats = useMemo(() => ({
    total: alerts.length,
    verified: alerts.filter(a => a.verified).length,
    active: alerts.filter(a => !a.expired).length,
    high: alerts.filter(a => a.severity === 'High').length
  }), [alerts])

  const filteredAlerts = useMemo(() => {
    let result = [...alerts]
    if (selectedFilter === 'high') result = result.filter(a => a.severity === 'High')
    else if (selectedFilter === 'unverified') result = result.filter(a => !a.verified)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a => a.type?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q) || a.id?.toString().includes(q) || a.location?.toLowerCase().includes(q))
    }
    return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [alerts, selectedFilter, searchQuery])

  useEffect(() => {
    if (!isMobile && filteredAlerts.length > 0 && !selectedAlert) setSelectedAlert(filteredAlerts[0])
  }, [filteredAlerts.length, isMobile])

  const handleDelete = (id) => {
    setAlerts?.(prev => prev.filter(a => a.id !== id))
    if (selectedAlert?.id === id) setSelectedAlert(filteredAlerts.find(a => a.id !== id) || null)
  }

  const handleVerify = (id) => {
    setAlerts?.(prev => prev.map(a => a.id === id ? { ...a, verified: !a.verified } : a))
    if (selectedAlert?.id === id) setSelectedAlert(prev => prev ? { ...prev, verified: !prev.verified } : null)
  }

  const openEditModal = (alert) => setEditModal({ 
    open: true, 
    data: { 
      id: alert.id,
      description: alert.description || '', 
      severity: alert.severity || 'Low', 
      type: alert.type || '',
      location: alert.location || '',
      photos: alert.photos ? [...alert.photos] : [],
      voiceNote: alert.voiceNote || null
    } 
  })

  const saveEdit = () => {
    if (setAlerts && editModal.data.id) {
      const updatedData = {
        type: editModal.data.type,
        description: editModal.data.description,
        severity: editModal.data.severity,
        photos: editModal.data.photos,
        voiceNote: editModal.data.voiceNote
      }
      setAlerts(prev => prev.map(a => a.id === editModal.data.id ? { ...a, ...updatedData } : a))
      setSelectedAlert(prev => prev && prev.id === editModal.data.id ? { ...prev, ...updatedData } : prev)
    }
    setEditModal({ open: false, data: {} })
  }

  const toggleAudio = (url) => {
    if (playingAudio === url) { audioRef.current?.pause(); setPlayingAudio(null) }
    else { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() }; setPlayingAudio(url) }
  }

  const selectAlert = (alert) => { setSelectedAlert(alert); if (isMobile) setShowMobileDetail(true) }

  const exportReport = () => {
    const data = JSON.stringify(alerts, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'alerts-report.json'; a.click()
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'alerts', label: 'Alerts', icon: ReportIcon, count: stats.total },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect handled by useEffect, show nothing while redirecting
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} className="hidden" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center z-40 px-2 sm:px-0">
        {/* Left Section - Logo & Branding */}
        <div className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-4 h-full ${isMobile ? '' : 'border-r border-slate-200 w-56'} shrink-0`}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <LocationOnIcon className="text-white" style={{ fontSize: isMobile ? 18 : 20 }} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base text-slate-800 leading-tight">Road<span className="text-emerald-500">Guard</span></span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium -mt-0.5">Admin Console</span>
            </div>
          </Link>
        </div>

        {/* Center Section - Search & Quick Actions */}
        <div className="flex-1 flex items-center justify-between px-2 sm:px-4 h-full min-w-0">
          {/* Breadcrumb / Context */}
          <div className="flex items-center gap-3">
            {!isMobile && activeTab === 'alerts' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <AdminPanelSettingsIcon className="text-emerald-600" style={{ fontSize: 16 }} />
                <span className="text-sm font-medium text-slate-700">Alert Management</span>
              </div>
            )}
            {!isMobile && activeTab === 'alerts' && (
              <div className="hidden xl:flex items-center gap-1 text-xs text-slate-400">
                <span className="px-2 py-1 bg-slate-50 rounded border border-slate-200 font-mono">V</span>
                <span>Verify</span>
                <span className="px-2 py-1 bg-slate-50 rounded border border-slate-200 font-mono ml-2">E</span>
                <span>Edit</span>
                <span className="px-2 py-1 bg-slate-50 rounded border border-slate-200 font-mono ml-2">D</span>
                <span>Delete</span>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick Links */}
            <Link to="/map" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
              <MapIcon style={{ fontSize: 16 }} /> View Map
            </Link>
            
            {/* Refresh Button */}
            <button className="p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors" title="Refresh Data">
              <RefreshIcon style={{ fontSize: isMobile ? 20 : 18 }} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className={`p-1.5 sm:p-2 rounded-lg transition-colors relative ${showNotifications ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`} 
                title="Notifications"
              >
                <NotificationsIcon style={{ fontSize: isMobile ? 20 : 18 }} />
                {(stats.high > 0 || alerts.filter(a => !a.verified).length > 0) && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className={`absolute top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 ${isMobile ? 'right-0 left-auto w-72' : 'right-0 w-80'}`}>
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    <span className="text-xs text-slate-500">{notifications.length} items</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400">
                        <NotificationsIcon style={{ fontSize: 32 }} className="opacity-30 mb-2" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : notifications.map((notif, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (notif.alert) {
                            setSelectedAlert(notif.alert)
                            setActiveTab('alerts')
                          } else if (notif.alerts?.length > 0) {
                            setSelectedAlert(notif.alerts[0])
                            setActiveTab('alerts')
                            if (notif.icon === 'high') setSelectedFilter('high')
                            else if (notif.icon === 'unverified') setSelectedFilter('unverified')
                          }
                          setShowNotifications(false)
                        }}
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          notif.icon === 'high' ? 'bg-red-100 text-red-600' : 
                          notif.icon === 'unverified' ? 'bg-amber-100 text-amber-600' : 
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {notif.icon === 'high' ? <WarningAmberIcon style={{ fontSize: 16 }} /> : 
                           notif.icon === 'unverified' ? <ReportIcon style={{ fontSize: 16 }} /> : 
                           <LocationOnIcon style={{ fontSize: 16 }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">{notif.title}</p>
                          <p className="text-xs text-slate-500 truncate">{notif.desc}</p>
                          {notif.time && <p className="text-[10px] text-slate-400 mt-0.5">{notif.time}</p>}
                        </div>
                        <ChevronRightIcon className="text-slate-300" style={{ fontSize: 16 }} />
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                    <button 
                      onClick={() => { setActiveTab('alerts'); setSelectedFilter('all'); setShowNotifications(false) }}
                      className="w-full text-center text-sm text-emerald-600 font-medium hover:text-emerald-700 py-1"
                    >
                      View All Alerts
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help */}
            <button className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors" title="Help">
              <HelpOutlineIcon style={{ fontSize: 18 }} />
            </button>

            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

            {/* Export Button */}
            <button onClick={exportReport} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm">
              <FileDownloadIcon style={{ fontSize: 16 }} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Admin Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 ml-1 border-l border-slate-200 hover:bg-slate-50 rounded-lg py-1 pr-2 transition-colors"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-emerald-500" />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </div>
                )}
                <div className="hidden lg:flex flex-col">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">{user?.displayName || 'Admin'}</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email || 'admin@roadguard.com'}</span>
                </div>
                <ExpandMoreIcon className={`hidden lg:block text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} style={{ fontSize: 18 }} />
              </button>
              
              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{user?.displayName || 'Admin User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <LogoutIcon style={{ fontSize: 18 }} />
                      <span className="text-sm font-medium">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={`flex pt-14 ${isMobile ? 'pb-16' : ''}`}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="sticky top-14 h-[calc(100vh-56px)] w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <nav className="flex-1 p-3 space-y-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <tab.icon style={{ fontSize: 18 }} /><span>{tab.label}</span>
                  {tab.count !== undefined && <span className={`ml-auto px-1.5 py-0.5 rounded text-xs font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200'}`}>{tab.count}</span>}
                </button>
              ))}
            </nav>
            {/* Sidebar Footer */}
            <div className="p-3 border-t border-slate-100">
              <Link to="/" className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                <LogoutIcon style={{ fontSize: 18 }} />
                <span>Exit Admin</span>
              </Link>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-56px)]">
          {activeTab === 'dashboard' && <DashboardTab stats={stats} alerts={alerts} isMobile={isMobile} />}
          {activeTab === 'alerts' && <AlertsTab isMobile={isMobile} filteredAlerts={filteredAlerts} selectedAlert={selectedAlert} selectAlert={selectAlert} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} alerts={alerts} handleVerify={handleVerify} handleDelete={handleDelete} openEditModal={openEditModal} setActionModal={setActionModal} playingAudio={playingAudio} toggleAudio={toggleAudio} getCommentsForAlert={getCommentsForAlert} displaySettings={displaySettings} />}
          {activeTab === 'history' && <HistoryTab alerts={alerts} isMobile={isMobile} displaySettings={displaySettings} />}
          {activeTab === 'settings' && <SettingsTab ttlSettings={ttlSettings} setTtlSettings={setTtlSettings} alertSettings={alertSettings} setAlertSettings={setAlertSettings} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} displaySettings={displaySettings} setDisplaySettings={setDisplaySettings} settingsChanged={settingsChanged} setSettingsChanged={setSettingsChanged} saveAllSettings={saveAllSettings} isMobile={isMobile} notificationPermission={notificationPermission} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-40 safe-area-pb">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-lg transition-colors ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-emerald-50' : ''}`}>
                <tab.icon style={{ fontSize: 22 }} />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-500'}`}>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="absolute -top-0.5 right-1/4 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{tab.count > 99 ? '99+' : tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      )}

      {/* Mobile Detail */}
      {isMobile && showMobileDetail && selectedAlert && (
        <MobileDetailModal alert={selectedAlert} onClose={() => setShowMobileDetail(false)} handleVerify={handleVerify} handleDelete={handleDelete} openEditModal={openEditModal} setActionModal={setActionModal} setShowMobileDetail={setShowMobileDetail} playingAudio={playingAudio} toggleAudio={toggleAudio} comments={getCommentsForAlert?.(selectedAlert.id) || []} />
      )}

      {/* Edit Modal */}
      {editModal.open && <EditModal editModal={editModal} setEditModal={setEditModal} saveEdit={saveEdit} />}

      {/* Action Modal */}
      {actionModal.open && <ActionModal actionModal={actionModal} setActionModal={setActionModal} />}
    </div>
  )
}

// Dashboard Tab
function DashboardTab({ stats, alerts, isMobile }) {
  // Analytics calculations
  const severityBreakdown = useMemo(() => ({
    high: alerts.filter(a => a.severity === 'High').length,
    medium: alerts.filter(a => a.severity === 'Medium').length,
    low: alerts.filter(a => a.severity === 'Low').length
  }), [alerts])

  const typeBreakdown = useMemo(() => {
    const counts = {}
    alerts.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [alerts])

  const verificationRate = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0
  const highPriorityRate = stats.total > 0 ? Math.round((stats.high / stats.total) * 100) : 0

  return (
    <div className={`p-4 ${isMobile ? 'pb-20' : 'lg:p-6'} max-w-6xl mx-auto`}>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Dashboard Overview</h1>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: ReportIcon, label: 'Total Alerts', value: stats.total, color: 'emerald', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
          { icon: VerifiedIcon, label: 'Verified', value: stats.verified, color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
          { icon: CheckCircleIcon, label: 'Active', value: stats.active, color: 'violet', bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
          { icon: WarningAmberIcon, label: 'High Priority', value: stats.high, color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${s.bgColor} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className={s.textColor} style={{ fontSize: 20 }} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Severity Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUpIcon className="text-slate-400" style={{ fontSize: 18 }} />
            Severity Breakdown
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  High Priority
                </span>
                <span className="font-semibold text-slate-800">{severityBreakdown.high}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${stats.total ? (severityBreakdown.high / stats.total) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Medium Priority
                </span>
                <span className="font-semibold text-slate-800">{severityBreakdown.medium}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${stats.total ? (severityBreakdown.medium / stats.total) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Low Priority
                </span>
                <span className="font-semibold text-slate-800">{severityBreakdown.low}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${stats.total ? (severityBreakdown.low / stats.total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <VerifiedIcon className="text-slate-400" style={{ fontSize: 18 }} />
            Verification Status
          </h3>
          <div className="flex items-center justify-center py-2">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${verificationRate} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-slate-800">{verificationRate}%</span>
                <span className="text-xs text-slate-500">Verified</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <div className="text-center">
              <p className="font-semibold text-blue-600">{stats.verified}</p>
              <p className="text-slate-500 text-xs">Verified</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-600">{stats.total - stats.verified}</p>
              <p className="text-slate-500 text-xs">Unverified</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">{stats.total}</p>
              <p className="text-slate-500 text-xs">Total</p>
            </div>
          </div>
        </div>

        {/* Top Alert Types */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ReportIcon className="text-slate-400" style={{ fontSize: 18 }} />
            Top Alert Types
          </h3>
          {typeBreakdown.length > 0 ? (
            <div className="space-y-2.5">
              {typeBreakdown.map(([type, count], idx) => (
                <div key={type} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : 
                    idx === 1 ? 'bg-slate-200 text-slate-600' : 
                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                  }`}>{idx + 1}</span>
                  <span className="flex-1 text-sm text-slate-700 truncate">{type}</span>
                  <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-sm">No data available</div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-100 text-sm">Response Rate</span>
            <TrendingUpIcon style={{ fontSize: 18 }} className="text-emerald-200" />
          </div>
          <p className="text-2xl font-bold">{verificationRate}%</p>
          <p className="text-emerald-100 text-xs mt-1">Alerts verified</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-100 text-sm">Urgent Alerts</span>
            <WarningAmberIcon style={{ fontSize: 18 }} className="text-red-200" />
          </div>
          <p className="text-2xl font-bold">{highPriorityRate}%</p>
          <p className="text-red-100 text-xs mt-1">High priority</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm">Avg. per Day</span>
            <AccessTimeIcon style={{ fontSize: 18 }} className="text-blue-200" />
          </div>
          <p className="text-2xl font-bold">{Math.round(stats.total / 7) || 0}</p>
          <p className="text-blue-100 text-xs mt-1">Last 7 days avg</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-violet-100 text-sm">Active Now</span>
            <CheckCircleIcon style={{ fontSize: 18 }} className="text-violet-200" />
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-violet-100 text-xs mt-1">Currently active</p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-800">Recent Alerts</span>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{alerts.length} total</span>
        </div>
        <div className="divide-y divide-slate-100">
          {alerts.slice(0, 5).map(a => (
            <div key={a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.severity === 'High' ? 'bg-red-500' : a.severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{a.type}</p>
                <p className="text-sm text-slate-500 truncate">{a.location || 'Unknown location'}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{getTimeAgo(a.timestamp)}</span>
              {a.verified && <VerifiedIcon className="text-blue-500 shrink-0" style={{ fontSize: 16 }} />}
            </div>
          ))}
          {!alerts.length && <div className="py-12 text-center text-slate-400">No alerts yet</div>}
        </div>
      </div>
    </div>
  )
}

// Alerts Tab
function AlertsTab({ isMobile, filteredAlerts, selectedAlert, selectAlert, searchQuery, setSearchQuery, selectedFilter, setSelectedFilter, alerts, handleVerify, handleDelete, openEditModal, setActionModal, playingAudio, toggleAudio, getCommentsForAlert }) {
  return (
    <div className="h-[calc(100vh-56px)] flex overflow-hidden">
      {/* List Panel */}
      <div className={`${isMobile ? 'w-full' : 'w-64 xl:w-72'} bg-white border-r border-slate-200 flex flex-col shrink-0 h-full`}>
        <div className="p-3 border-b border-slate-100">
          <div className="relative mb-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
            <input type="text" placeholder="Search alerts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-slate-200" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[{ id: 'all', label: `All (${alerts.length})` }, { id: 'high', label: 'High' }, { id: 'unverified', label: 'Unverified' }].map(f => (
              <button key={f.id} onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedFilter === f.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <ReportIcon style={{ fontSize: 40 }} className="opacity-30 mb-2" /><p className="text-sm">No alerts found</p>
            </div>
          ) : filteredAlerts.map(alert => (
            <button key={alert.id} onClick={() => selectAlert(alert)}
              className={`w-full p-3 flex gap-3 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedAlert?.id === alert.id ? 'bg-emerald-50 border-l-3 border-l-emerald-500' : ''}`}>
              <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 relative">
                {alert.photos?.length > 0 ? (
                  <>
                    <img src={getPhotoUrl(alert.photos[0])} alt="" className="w-full h-full object-cover" />
                    {alert.photos.length > 1 && (
                      <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded font-medium">+{alert.photos.length - 1}</div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="font-semibold text-slate-800 text-sm truncate flex-1">{alert.type}</h4>
                  {alert.verified && <VerifiedIcon className="text-blue-500 shrink-0" style={{ fontSize: 14 }} />}
                </div>
                <p className="text-xs text-slate-500 truncate mb-1">{alert.location || 'Unknown location'}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${alert.severity === 'High' ? 'bg-red-100 text-red-600' : alert.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>{alert.severity}</span>
                  <span className="text-[10px] text-slate-400">{getTimeAgo(alert.timestamp)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Detail */}
      {!isMobile && (
        <div className="flex-1 flex overflow-hidden">
          {selectedAlert ? (
            <AlertDetailDesktop alert={selectedAlert} handleVerify={handleVerify} handleDelete={handleDelete} openEditModal={openEditModal} setActionModal={setActionModal} playingAudio={playingAudio} toggleAudio={toggleAudio} comments={getCommentsForAlert?.(selectedAlert.id) || []} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
              <div className="text-center"><ReportIcon style={{ fontSize: 56 }} className="opacity-20 mb-2" /><p>Select an alert to view details</p></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Desktop Alert Detail
function AlertDetailDesktop({ alert, handleVerify, handleDelete, openEditModal, setActionModal, playingAudio, toggleAudio, comments }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const photos = alert.photos || []

  const nextPhoto = () => setCurrentPhotoIndex(prev => (prev + 1) % photos.length)
  const prevPhoto = () => setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length)

  return (
    <div className="flex-1 flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 bg-slate-50 p-4 overflow-y-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-mono">#{alert.id?.toString().slice(-8) || 'N/A'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${alert.severity === 'High' ? 'bg-red-100 text-red-600' : alert.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>{alert.severity} Priority</span>
              {alert.verified && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold flex items-center gap-0.5"><VerifiedIcon style={{ fontSize: 10 }} /> Verified</span>}
            </div>
            <div className="hidden xl:block h-4 w-px bg-slate-200" />
            <h1 className="text-lg font-bold text-slate-800 truncate">{alert.type}</h1>
            <span className="text-xs text-slate-500 hidden lg:block">By @{alert.contributor || 'anonymous'} • {new Date(alert.timestamp).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg border border-green-100">
              <ThumbUpIcon className="text-green-500" style={{ fontSize: 14 }} />
              <span className="font-bold text-slate-700 text-sm">{alert.votesUp || 0}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg border border-red-100">
              <ThumbDownIcon className="text-red-500" style={{ fontSize: 14 }} />
              <span className="font-bold text-slate-700 text-sm">{alert.votesDown || 0}</span>
            </div>
          </div>
        </div>

        {/* Content - 2 Column Layout */}
        <div className="flex gap-3 h-[calc(100%-70px)]">
          {/* Left Column - Photo & Details */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Photo Gallery - Fixed Height */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <PhotoLibraryIcon style={{ fontSize: 14 }} /> Photos ({photos.length})
                </h3>
                {photos.length > 1 && <span className="text-xs text-slate-400">{currentPhotoIndex + 1} / {photos.length}</span>}
              </div>
              <div className="relative bg-slate-900 flex-1 min-h-0">
                {photos.length > 0 ? (
                  <>
                    <img src={getPhotoUrl(photos[currentPhotoIndex])} alt="" className="w-full h-full object-contain" />
                    {photos.length > 1 && (
                      <>
                        <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                          <ChevronLeftIcon style={{ fontSize: 18 }} />
                        </button>
                        <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                          <ChevronRightIcon style={{ fontSize: 18 }} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <div className="text-center"><ImageIcon style={{ fontSize: 40 }} className="opacity-30" /><p className="text-sm mt-1">No photos</p></div>
                  </div>
                )}
              </div>
              {photos.length > 1 && (
                <div className="p-3 flex gap-3 overflow-x-auto bg-slate-100 border-t border-slate-200 shrink-0">
                  {photos.map((p, i) => {
                    const photoUrl = getPhotoUrl(p)
                    return (
                      <button key={i} onClick={() => setCurrentPhotoIndex(i)} 
                        className={`w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all shadow-sm ${currentPhotoIndex === i ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105' : 'border-slate-300 hover:border-emerald-400 hover:scale-102'}`}>
                        {photoUrl ? (
                          <img src={photoUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover bg-slate-200" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <ImageIcon className="text-slate-400" style={{ fontSize: 20 }} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Description & Voice - Fixed at bottom */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <h3 className="text-xs font-semibold text-slate-600 mb-1.5">Reporter Description</h3>
                <p className="text-slate-700 text-sm leading-relaxed line-clamp-3">{alert.description || 'No description provided.'}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <h3 className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <MicIcon style={{ fontSize: 14 }} /> Voice Recording
                </h3>
                {alert.voiceNote ? (
                  <button onClick={() => toggleAudio(alert.voiceNote)} className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg hover:bg-violet-100 w-full transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${playingAudio === alert.voiceNote ? 'bg-violet-500' : 'bg-violet-300'}`}>
                      {playingAudio === alert.voiceNote ? <PauseIcon className="text-white" style={{ fontSize: 16 }} /> : <PlayArrowIcon className="text-white" style={{ fontSize: 16 }} />}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-700 text-xs">{playingAudio === alert.voiceNote ? 'Playing...' : 'Play Recording'}</p>
                      <p className="text-[10px] text-slate-500">Voice description</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center justify-center h-12 text-slate-400 text-xs">No voice recording</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Location, Actions, Comments */}
          <div className="w-72 xl:w-80 flex flex-col gap-3 shrink-0">
            {/* Location Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shrink-0">
              <h3 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                <LocationOnIcon className="text-emerald-500" style={{ fontSize: 14 }} /> Location
              </h3>
              <p className="font-medium text-slate-800 text-sm mb-0.5">{alert.location || 'Unknown location'}</p>
              {alert.lat && alert.lng && (
                <>
                  <p className="text-[11px] text-slate-500 font-mono mb-2">{alert.lat.toFixed(6)}, {alert.lng.toFixed(6)}</p>
                  <a href={`https://www.google.com/maps?q=${alert.lat},${alert.lng}`} target="_blank" rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">
                    <OpenInNewIcon style={{ fontSize: 14 }} /> Open in Google Maps
                  </a>
                </>
              )}
            </div>

            {/* Admin Actions Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shrink-0">
              <h3 className="text-xs font-semibold text-slate-600 mb-2">Admin Actions</h3>
              <div className="space-y-1.5">
                <button onClick={() => handleVerify(alert.id)} className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium text-xs transition-colors ${alert.verified ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'}`}>
                  <VerifiedIcon style={{ fontSize: 14 }} /> {alert.verified ? 'Remove Verified Badge' : 'Mark as Verified'}
                </button>
                <button onClick={() => openEditModal(alert)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                  <EditIcon style={{ fontSize: 14 }} /> Edit Alert Details
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={() => setActionModal({ open: true, type: 'warning', alert })} className="flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium text-[11px] bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                    <WarningAmberIcon style={{ fontSize: 12 }} /> Warn
                  </button>
                  <button onClick={() => setActionModal({ open: true, type: 'ban', alert })} className="flex items-center justify-center gap-1 py-1.5 rounded-lg font-medium text-[11px] bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
                    <BlockIcon style={{ fontSize: 12 }} /> Ban User
                  </button>
                </div>
                <button onClick={() => handleDelete(alert.id)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium text-xs text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                  <DeleteIcon style={{ fontSize: 14 }} /> Delete Alert
                </button>
              </div>
            </div>

            {/* Comments Section - Fills remaining space */}
            <div className="bg-white rounded-xl border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ChatBubbleOutlineIcon style={{ fontSize: 14 }} /> Public Comments
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-600">{comments.length}</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {comments.length > 0 ? comments.map((comment, idx) => (
                  <div key={comment.id || idx} className="px-3 py-2">
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${comment.isOfficial ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {comment.isOfficial ? <LocalPoliceIcon style={{ fontSize: 12 }} /> : comment.author?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-semibold text-slate-800 text-xs">{comment.author || 'Anonymous'}</span>
                          {comment.isOfficial && <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-medium">Official</span>}
                          <span className="text-[10px] text-slate-400">{comment.time}</span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-6">No comments yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}// History Tab
function HistoryTab({ alerts, isMobile }) {
  const [historyFilter, setHistoryFilter] = useState('all')
  const [historySearch, setHistorySearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [selectedTimeRange, setSelectedTimeRange] = useState('all')

  // Filter and sort alerts
  const filteredHistory = useMemo(() => {
    let result = [...alerts]
    
    // Time range filter
    if (selectedTimeRange !== 'all') {
      const now = new Date()
      const ranges = {
        'today': 1,
        'week': 7,
        'month': 30,
        'quarter': 90
      }
      const days = ranges[selectedTimeRange] || 0
      const cutoff = new Date(now - days * 24 * 60 * 60 * 1000)
      result = result.filter(a => new Date(a.timestamp) >= cutoff)
    }

    // Status filter
    if (historyFilter === 'verified') result = result.filter(a => a.verified)
    else if (historyFilter === 'unverified') result = result.filter(a => !a.verified)
    else if (historyFilter === 'high') result = result.filter(a => a.severity === 'High')
    else if (historyFilter === 'expired') result = result.filter(a => a.expired)

    // Search filter
    if (historySearch) {
      const q = historySearch.toLowerCase()
      result = result.filter(a => 
        a.type?.toLowerCase().includes(q) || 
        a.location?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.contributor?.toLowerCase().includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [alerts, historyFilter, historySearch, sortOrder, selectedTimeRange])



  // Group by date for timeline view
  const groupedByDate = useMemo(() => {
    const groups = {}
    filteredHistory.forEach(alert => {
      const date = new Date(alert.timestamp).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: new Date(alert.timestamp).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(alert)
    })
    return groups
  }, [filteredHistory])

  if (isMobile) {
    return (
      <div className="pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-800">Alert History</h1>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                {filteredHistory.length} alerts
              </span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {[
              { id: 'all', label: 'All' },
              { id: 'verified', label: 'Verified' },
              { id: 'unverified', label: 'Unverified' },
              { id: 'high', label: 'High Priority' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setHistoryFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  historyFilter === filter.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

       
        {/* Timeline View */}
        <div className="px-4 space-y-4">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <HistoryIcon style={{ fontSize: 48 }} className="text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">No history found</p>
              <p className="text-sm text-slate-400 mt-1">Alerts will appear here once reported</p>
            </div>
          ) : Object.entries(groupedByDate).map(([date, dateAlerts]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <AccessTimeIcon className="text-slate-500" style={{ fontSize: 16 }} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{date}</span>
                <span className="text-xs text-slate-400">({dateAlerts.length})</span>
              </div>

              {/* Alerts for this date */}
              <div className="ml-4 pl-4 border-l-2 border-slate-200 space-y-3">
                {dateAlerts.map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3 relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 border-white ${
                      a.severity === 'High' ? 'bg-red-500' : a.severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800 text-sm truncate">{a.type}</h3>
                          {a.verified && <VerifiedIcon className="text-blue-500 shrink-0" style={{ fontSize: 14 }} />}
                        </div>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <LocationOnIcon style={{ fontSize: 12 }} />
                          {a.location || 'Unknown location'}
                        </p>
                        {a.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">"{a.description}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(a.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {a.contributor && (
                            <span className="text-[10px] text-slate-400">• @{a.contributor}</span>
                          )}
                          <div className="flex items-center gap-1 ml-auto">
                            <ThumbUpIcon className="text-green-500" style={{ fontSize: 10 }} />
                            <span className="text-[10px] text-slate-500">{a.votesUp || 0}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        a.severity === 'High' ? 'bg-red-100 text-red-600' : 
                        a.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {a.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Desktop View
  return (
    <div className="h-[calc(100vh-56px)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Alert History</h1>
            <p className="text-sm text-slate-500">View and analyze past alerts</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors flex items-center gap-2">
              <FileDownloadIcon style={{ fontSize: 16 }} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by type, location, contributor..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Time Range */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
              </select>

              {/* Status Filter */}
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="high">High Priority</option>
                <option value="expired">Expired</option>
              </select>

              {/* Sort */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>

              {/* Results count */}
              <div className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredHistory.length}</span> of {alerts.length}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Alert Details</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contributor</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Severity</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Engagement</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <HistoryIcon style={{ fontSize: 48 }} className="text-slate-200 mb-3" />
                        <p className="text-slate-500 font-medium">No history found</p>
                        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  ) : filteredHistory.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            a.severity === 'High' ? 'bg-red-100' : a.severity === 'Medium' ? 'bg-amber-100' : 'bg-emerald-100'
                          }`}>
                            <WarningAmberIcon className={
                              a.severity === 'High' ? 'text-red-600' : a.severity === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                            } style={{ fontSize: 20 }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{a.type}</p>
                            {a.description && (
                              <p className="text-xs text-slate-400 truncate max-w-[200px]">"{a.description}"</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <LocationOnIcon className="text-slate-400" style={{ fontSize: 14 }} />
                          <span className="truncate max-w-[180px]">{a.location || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                            {(a.contributor || 'A')[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-600">@{a.contributor || 'anonymous'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          a.severity === 'High' ? 'bg-red-100 text-red-700' : 
                          a.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            a.severity === 'High' ? 'bg-red-500' : a.severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          {a.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {a.verified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                              <VerifiedIcon style={{ fontSize: 12 }} /> Verified
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                              Unverified
                            </span>
                          )}
                          {a.expired && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded text-[10px] font-medium">
                              Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <ThumbUpIcon className="text-green-500" style={{ fontSize: 14 }} />
                            <span className="text-sm font-medium text-slate-700">{a.votesUp || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbDownIcon className="text-red-400" style={{ fontSize: 14 }} />
                            <span className="text-sm font-medium text-slate-700">{a.votesDown || 0}</span>
                          </div>
                          {a.photos?.length > 0 && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <PhotoLibraryIcon style={{ fontSize: 14 }} />
                              <span className="text-xs">{a.photos.length}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(a.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Tab
function SettingsTab({ ttlSettings, setTtlSettings, alertSettings, setAlertSettings, notificationSettings, setNotificationSettings, displaySettings, setDisplaySettings, settingsChanged, setSettingsChanged, saveAllSettings, isMobile, notificationPermission }) {
  const [activeSettingsSection, setActiveSettingsSection] = useState('alerts')
  const [moderationSettings, setModerationSettings] = useState({
    requirePhotoEvidence: false,
    allowAnonymous: true,
    profanityFilter: true,
    spamDetection: true
  })

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (Notification?.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const settingsSections = [
    { id: 'alerts', label: 'Alerts', icon: ReportIcon },
    { id: 'notifications', label: 'Notifications', icon: NotificationsIcon },
    { id: 'display', label: 'Display', icon: DashboardIcon },
    { id: 'moderation', label: 'Moderation', icon: AdminPanelSettingsIcon },
    { id: 'advanced', label: 'Advanced', icon: SettingsIcon }
  ]

  if (isMobile) {
    return (
      <div className="pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-800">Settings</h1>
            <button 
              onClick={saveAllSettings} 
              disabled={!settingsChanged}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 text-sm transition-colors ${
                settingsChanged ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <SaveIcon style={{ fontSize: 14 }} /> Save
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="sticky top-[53px] z-10 bg-slate-50 border-b border-slate-200 px-2 py-2 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {settingsSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSettingsSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeSettingsSection === section.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <section.icon style={{ fontSize: 14 }} />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Settings Content */}
        <div className="p-4 space-y-4">
          {/* Alert Settings */}
          {activeSettingsSection === 'alerts' && (
            <>
              {/* TTL Settings */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <AccessTimeIcon className="text-emerald-600" style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Alert TTL</h3>
                    <p className="text-[11px] text-slate-500">How long alerts stay active</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { key: 'Low', color: 'bg-emerald-500', label: 'Low Priority', icon: '🟢' },
                    { key: 'Medium', color: 'bg-amber-500', label: 'Medium Priority', icon: '🟡' },
                    { key: 'High', color: 'bg-red-500', label: 'High Priority', icon: '🔴' }
                  ].map(({ key, color, label, icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="font-medium text-slate-700 text-sm">{label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="number" 
                          value={ttlSettings[key]} 
                          onChange={(e) => { setTtlSettings(p => ({ ...p, [key]: parseInt(e.target.value) || 0 })); setSettingsChanged(true) }} 
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded text-center text-sm font-medium focus:ring-2 focus:ring-emerald-500" 
                          min="1" 
                        />
                        <span className="text-xs text-slate-500">min</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Quick Presets */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Quick Presets:</p>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={() => { setTtlSettings({ Low: 15, Medium: 30, High: 60 }); setSettingsChanged(true) }}
                        className="px-3 py-1.5 bg-slate-100 rounded text-xs font-medium text-slate-700"
                      >
                        🚀 Short
                      </button>
                      <button 
                        onClick={() => { setTtlSettings({ Low: 30, Medium: 60, High: 120 }); setSettingsChanged(true) }}
                        className="px-3 py-1.5 bg-emerald-100 rounded text-xs font-medium text-emerald-700"
                      >
                        ⚖️ Balanced
                      </button>
                      <button 
                        onClick={() => { setTtlSettings({ Low: 60, Medium: 120, High: 240 }); setSettingsChanged(true) }}
                        className="px-3 py-1.5 bg-slate-100 rounded text-xs font-medium text-slate-700"
                      >
                        🐢 Extended
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Boost */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-white border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <VerifiedIcon className="text-violet-600" style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Verified Boost</h3>
                    <p className="text-[11px] text-slate-500">Extend TTL for verified alerts</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <VerifiedIcon className="text-blue-500" style={{ fontSize: 16 }} />
                      <span className="font-medium text-slate-700 text-sm">TTL Extension</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={alertSettings.verifiedBoostPercent} onChange={(e) => { setAlertSettings(prev => ({ ...prev, verifiedBoostPercent: parseInt(e.target.value) || 0 })); setSettingsChanged(true) }} className="w-14 px-2 py-1.5 border border-slate-200 rounded text-center text-sm font-medium" min="0" />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notification Settings */}
          {activeSettingsSection === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <NotificationsIcon className="text-blue-600" style={{ fontSize: 18 }} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                  <p className="text-[11px] text-slate-500">How you receive alerts</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* Push Notifications with permission status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>🔔</span>
                      <span className="font-medium text-slate-700 text-sm">Push Notifications</span>
                    </div>
                    <p className="text-[10px] text-slate-500 ml-6 mt-0.5">
                      {notificationPermission === 'granted' ? '✅ Enabled' : 
                       notificationPermission === 'denied' ? '❌ Blocked' : 
                       '⚠️ Permission needed'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notificationPermission === 'default' && (
                      <button
                        onClick={requestNotificationPermission}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-medium"
                      >
                        Allow
                      </button>
                    )}
                    <button
                      onClick={() => { setNotificationSettings(prev => ({ ...prev, pushNotifications: !prev.pushNotifications })); setSettingsChanged(true); }}
                      className={`relative w-10 h-6 rounded-full transition-all ${notificationSettings.pushNotifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notificationSettings.pushNotifications ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Other settings */}
                {[
                  { key: 'soundEnabled', label: 'Sound Alerts', icon: '🔊' }
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="font-medium text-slate-700 text-sm">{label}</span>
                    </div>
                    <button
                      onClick={() => { setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] })); setSettingsChanged(true); }}
                      className={`relative w-10 h-6 rounded-full transition-all ${notificationSettings[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                        notificationSettings[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}>
                        {notificationSettings[key] && (
                          <svg className="text-emerald-500 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
                
                {/* Delivery Mode */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Delivery Mode:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'realtime', label: 'Real-time' },
                      { id: 'hourly', label: 'Hourly' },
                      { id: 'daily', label: 'Daily' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => { setNotificationSettings(prev => ({ ...prev, digestMode: mode.id })); setSettingsChanged(true); }}
                        className={`py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          notificationSettings.digestMode === mode.id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings */}
          {activeSettingsSection === 'display' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DashboardIcon className="text-purple-600" style={{ fontSize: 18 }} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Display</h3>
                  <p className="text-[11px] text-slate-500">UI preferences</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { key: 'showThumbnails', label: 'Show Thumbnails', icon: '🖼️' },
                  { key: 'autoRefresh', label: 'Auto Refresh', icon: '🔄' }
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="font-medium text-slate-700 text-sm">{label}</span>
                    </div>
                    <button
                      onClick={() => { setDisplaySettings(prev => ({ ...prev, [key]: !prev[key] })); setSettingsChanged(true); }}
                      className={`relative w-10 h-6 rounded-full transition-all ${displaySettings[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                        displaySettings[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}>
                        {displaySettings[key] && (
                          <svg className="text-purple-500 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                ))}

                {displaySettings.autoRefresh && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 text-sm">Refresh Interval</span>
                      <div className="flex items-center gap-2">
                        <input type="range" min="10" max="120" step="10" value={displaySettings.refreshInterval}
                          onChange={(e) => { setDisplaySettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) })); setSettingsChanged(true); }}
                          className="w-20 accent-emerald-500" />
                        <span className="text-sm font-medium text-slate-700 w-8">{displaySettings.refreshInterval}s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Moderation Settings */}
          {activeSettingsSection === 'moderation' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-white border-b border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AdminPanelSettingsIcon className="text-orange-600" style={{ fontSize: 18 }} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Moderation</h3>
                  <p className="text-[11px] text-slate-500">Content policies</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { key: 'requirePhotoEvidence', label: 'Require Photo', icon: '📷' },
                  { key: 'allowAnonymous', label: 'Allow Anonymous', icon: '👤' },
                  { key: 'profanityFilter', label: 'Profanity Filter', icon: '🤬' },
                  { key: 'spamDetection', label: 'Spam Detection', icon: '🛡️' }
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="font-medium text-slate-700 text-sm">{label}</span>
                    </div>
                    <button
                      onClick={() => { setModerationSettings(prev => ({ ...prev, [key]: !prev[key] })); setSettingsChanged(true); }}
                      className={`relative w-10 h-6 rounded-full transition-all ${moderationSettings[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                        moderationSettings[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}>
                        {moderationSettings[key] && (
                          <svg className="text-amber-500 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeSettingsSection === 'advanced' && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-slate-100 to-white border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <SettingsIcon className="text-slate-600" style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Advanced</h3>
                    <p className="text-[11px] text-slate-500">System options</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>📊</span>
                      <span className="font-medium text-slate-700 text-sm">Export Data</span>
                    </div>
                    <button className="px-3 py-1.5 bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1">
                      <FileDownloadIcon style={{ fontSize: 12 }} /> Export
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>🗑️</span>
                      <span className="font-medium text-slate-700 text-sm">Clear Cache</span>
                    </div>
                    <button className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-medium">
                      Clear
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span>🔑</span>
                      <span className="font-medium text-slate-700 text-sm">API Key</span>
                    </div>
                    <input type="password" defaultValue="pk.eyJ1IjoiZGlwMDA3..."
                      className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-mono bg-white" readOnly />
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
                <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <WarningAmberIcon className="text-red-600" style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800 text-sm">Danger Zone</h3>
                    <p className="text-[11px] text-red-600">Irreversible actions</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <span className="font-medium text-slate-700 text-sm">Delete Expired</span>
                    <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                      Delete
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <span className="font-medium text-slate-700 text-sm">Reset Settings</span>
                    <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] overflow-hidden flex flex-col">
      {/* Header - Fixed */}
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Settings</h1>
            <p className="text-sm text-slate-500">Configure dashboard preferences and alert management</p>
          </div>
          <button 
            onClick={saveAllSettings} 
            disabled={!settingsChanged}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all text-sm ${
              settingsChanged 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <SaveIcon style={{ fontSize: 16 }} /> Save Changes
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden flex max-w-[1400px] mx-auto w-full">
        {/* Settings Sidebar - Fixed */}
        <div className="w-52 shrink-0 border-r border-slate-200 bg-slate-50/50 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {settingsSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSettingsSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                  activeSettingsSection === section.id
                    ? 'bg-white text-emerald-700 font-medium shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:bg-white/80'
                }`}
              >
                <section.icon style={{ fontSize: 18 }} className={activeSettingsSection === section.id ? 'text-emerald-500' : 'text-slate-400'} />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
          
          {/* Help Card */}
          <div className="p-3 mt-2">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-start gap-2">
                <HelpOutlineIcon className="text-blue-500 shrink-0" style={{ fontSize: 16 }} />
                <div>
                  <p className="text-xs font-medium text-blue-800">Need Help?</p>
                  <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">Check docs for configuration guides.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-3xl space-y-5">
            {/* Alert Settings */}
            {activeSettingsSection === 'alerts' && (
              <>
                {/* TTL Settings */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <AccessTimeIcon className="text-emerald-600" style={{ fontSize: 20 }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Alert Time-to-Live (TTL)</h3>
                      <p className="text-xs text-slate-500">How long alerts remain active before auto-expiring</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'Low', color: 'emerald', label: 'Low', desc: 'Minor issues', icon: '🟢' },
                        { key: 'Medium', color: 'amber', label: 'Medium', desc: 'Traffic delays', icon: '🟡' },
                        { key: 'High', color: 'red', label: 'High', desc: 'Accidents', icon: '🔴' }
                      ].map(({ key, color, label, desc, icon }) => (
                        <div key={key} className={`p-3 rounded-lg border-2 transition-all hover:shadow-sm ${
                          color === 'emerald' ? 'border-emerald-200 bg-emerald-50/50' :
                          color === 'amber' ? 'border-amber-200 bg-amber-50/50' :
                          'border-red-200 bg-red-50/50'
                        }`}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-sm">{icon}</span>
                            <span className="font-semibold text-slate-800 text-sm">{label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mb-2">{desc}</p>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={ttlSettings[key]} 
                              onChange={(e) => { setTtlSettings(p => ({ ...p, [key]: parseInt(e.target.value) || 0 })); setSettingsChanged(true) }} 
                              className={`w-full px-3 py-2 border rounded-lg text-center font-bold text-sm ${
                                color === 'emerald' ? 'border-emerald-200 focus:ring-emerald-500' :
                                color === 'amber' ? 'border-amber-200 focus:ring-amber-500' :
                                'border-red-200 focus:ring-red-500'
                              } focus:outline-none focus:ring-2`} 
                              min="1" 
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quick Presets */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">Presets:</span>
                      <button 
                        onClick={() => { setTtlSettings({ Low: 15, Medium: 30, High: 60 }); setSettingsChanged(true) }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-700 transition-colors"
                      >
                        🚀 Short
                      </button>
                      <button 
                        onClick={() => { setTtlSettings({ Low: 30, Medium: 60, High: 120 }); setSettingsChanged(true) }}
                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded text-xs font-medium text-emerald-700 transition-colors"
                      >
                        ⚖️ Balanced
                      </button>
                      <button 
                        onClick={() => { setTtlSettings({ Low: 60, Medium: 120, High: 240 }); setSettingsChanged(true) }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-700 transition-colors"
                      >
                        🐢 Extended
                      </button>
                    </div>
                  </div>
                </div>

                {/* Verified Boost */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-violet-50 to-white border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                      <VerifiedIcon className="text-violet-600" style={{ fontSize: 20 }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Verified Alerts Boost</h3>
                      <p className="text-xs text-slate-500">Extend TTL for verified alerts</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <VerifiedIcon className="text-blue-500" style={{ fontSize: 18 }} />
                        <div>
                          <p className="font-medium text-slate-800 text-sm">TTL Extension</p>
                          <p className="text-[11px] text-slate-500">Percentage boost for verified alerts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" value={alertSettings.verifiedBoostPercent} onChange={(e) => { setAlertSettings(prev => ({ ...prev, verifiedBoostPercent: parseInt(e.target.value) || 0 })); setSettingsChanged(true) }} className="w-16 px-2 py-1.5 border border-slate-200 rounded text-center text-sm font-medium focus:ring-2 focus:ring-violet-500" min="0" />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Notification Settings */}
            {activeSettingsSection === 'notifications' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <NotificationsIcon className="text-blue-600" style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Notification Preferences</h3>
                    <p className="text-xs text-slate-500">Control how and when you receive alerts</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {/* Push Notifications with permission status */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔔</span>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Push Notifications</p>
                        <p className="text-[11px] text-slate-500">
                          {notificationPermission === 'granted' ? '✅ Browser notifications enabled' : 
                           notificationPermission === 'denied' ? '❌ Blocked by browser' : 
                           '⚠️ Permission required'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notificationPermission === 'default' && (
                        <button
                          onClick={requestNotificationPermission}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                        >
                          Allow
                        </button>
                      )}
                      <button
                        onClick={() => { setNotificationSettings(prev => ({ ...prev, pushNotifications: !prev.pushNotifications })); setSettingsChanged(true); }}
                        className={`relative w-10 h-6 rounded-full transition-all ${notificationSettings.pushNotifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notificationSettings.pushNotifications ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Other notification settings */}
                  {[
                    { key: 'soundEnabled', label: 'Sound Alerts', desc: 'Play sound', icon: '🔊' }
                  ].map(({ key, label, desc, icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{label}</p>
                          <p className="text-[11px] text-slate-500">{desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] })); setSettingsChanged(true); }}
                        className={`relative w-10 h-6 rounded-full transition-all ${notificationSettings[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notificationSettings[key] ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Digest Mode */}
                  <div className="pt-3 border-t border-slate-200">
                    <h4 className="font-medium text-slate-700 text-sm mb-2">Delivery Mode</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'realtime', label: 'Real-time' },
                        { id: 'hourly', label: 'Hourly' },
                        { id: 'daily', label: 'Daily' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => { setNotificationSettings(prev => ({ ...prev, digestMode: mode.id })); setSettingsChanged(true); }}
                          className={`py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            notificationSettings.digestMode === mode.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Display Settings */}
            {activeSettingsSection === 'display' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DashboardIcon className="text-purple-600" style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Display & Interface</h3>
                    <p className="text-xs text-slate-500">Customize dashboard appearance</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { key: 'showThumbnails', label: 'Show Thumbnails', desc: 'Photo previews', icon: '🖼️' },
                    { key: 'autoRefresh', label: 'Auto Refresh', desc: 'Auto-refresh data', icon: '🔄' }
                  ].map(({ key, label, desc, icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{label}</p>
                          <p className="text-[11px] text-slate-500">{desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setDisplaySettings(prev => ({ ...prev, [key]: !prev[key] })); setSettingsChanged(true); }}
                        className={`relative w-10 h-6 rounded-full transition-all ${displaySettings[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${displaySettings[key] ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}

                  {displaySettings.autoRefresh && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800 text-sm">Refresh Interval</p>
                        <div className="flex items-center gap-2">
                          <input type="range" min="10" max="120" step="10" value={displaySettings.refreshInterval}
                            onChange={(e) => { setDisplaySettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) })); setSettingsChanged(true); }}
                            className="w-24 accent-emerald-500" />
                          <span className="w-10 text-center font-medium text-slate-700 text-sm">{displaySettings.refreshInterval}s</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Moderation Settings */}
            {activeSettingsSection === 'moderation' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-orange-50 to-white border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AdminPanelSettingsIcon className="text-orange-600" style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Moderation Settings</h3>
                    <p className="text-xs text-slate-500">Content moderation and user policies</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { key: 'requirePhotoEvidence', label: 'Require Photo', desc: 'Must include photo', icon: '📷' },
                    { key: 'allowAnonymous', label: 'Allow Anonymous', desc: 'Submit without login', icon: '👤' },
                    { key: 'profanityFilter', label: 'Profanity Filter', desc: 'Filter bad language', icon: '🤬' },
                    { key: 'spamDetection', label: 'Spam Detection', desc: 'Block spam', icon: '🛡️' }
                  ].map(({ key, label, desc, icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{label}</p>
                          <p className="text-[11px] text-slate-500">{desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setModerationSettings(prev => ({ ...prev, [key]: !prev[key] })); setSettingsChanged(true); }}
                        className={`relative w-10 h-6 rounded-full transition-all ${moderationSettings[key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${moderationSettings[key] ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            {activeSettingsSection === 'advanced' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-slate-100 to-white border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="text-slate-600" style={{ fontSize: 20 }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Advanced Options</h3>
                      <p className="text-xs text-slate-500">System configuration and data management</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🗑️</span>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">Clear Cache</p>
                          <p className="text-[11px] text-slate-500">Remove cached data</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300 transition-colors">
                        Clear
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔑</span>
                        <p className="font-medium text-slate-800 text-sm">API Key</p>
                      </div>
                      <input type="password" defaultValue="pk.eyJ1IjoiZGlwMDA3..."
                        className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-mono bg-white" readOnly />
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
                  <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                      <WarningAmberIcon className="text-red-600" style={{ fontSize: 20 }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800 text-sm">Danger Zone</h3>
                      <p className="text-xs text-red-600">Irreversible actions</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Delete Expired Alerts</p>
                        <p className="text-[11px] text-slate-500">Remove all expired</p>
                      </div>
                      <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors">
                        Delete
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Reset All Settings</p>
                        <p className="text-[11px] text-slate-500">Restore defaults</p>
                      </div>
                      <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors">
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile Detail Modal
function MobileDetailModal({ alert, onClose, handleVerify, handleDelete, openEditModal, setActionModal, setShowMobileDetail, playingAudio, toggleAudio, comments }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const photos = alert.photos || []
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}>
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-2 pb-1"><div className="w-10 h-1 bg-slate-300 rounded-full" /></div>
        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">{alert.type}</h3>
            <p className="text-xs text-slate-500">#{alert.id?.toString().slice(-8) || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full"><CloseIcon className="text-slate-500" style={{ fontSize: 20 }} /></button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-4 space-y-4">
          {/* Reporter Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs">{(alert.contributor || 'A')[0].toUpperCase()}</div>
              <div><p className="font-medium text-slate-800 text-sm">@{alert.contributor || 'anonymous'}</p><p className="text-xs text-slate-500">{getTimeAgo(alert.timestamp)}</p></div>
            </div>
            <div className="flex items-center gap-1.5">
              {alert.verified && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium flex items-center gap-0.5"><VerifiedIcon style={{ fontSize: 10 }} /></span>}
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${alert.severity === 'High' ? 'bg-red-100 text-red-600' : alert.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>{alert.severity}</span>
            </div>
          </div>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <div className="rounded-xl overflow-hidden bg-slate-900">
              <div className="relative aspect-video">
                <img src={getPhotoUrl(photos[currentPhotoIndex])} alt="" className="w-full h-full object-contain" />
                {photos.length > 1 && (
                  <>
                    <button onClick={() => setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">
                      <ChevronLeftIcon style={{ fontSize: 20 }} />
                    </button>
                    <button onClick={() => setCurrentPhotoIndex(prev => (prev + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">
                      <ChevronRightIcon style={{ fontSize: 20 }} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 rounded-full text-white text-xs">{currentPhotoIndex + 1} / {photos.length}</div>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="p-2 flex gap-1.5 overflow-x-auto bg-slate-100">
                  {photos.map((p, i) => (
                    <button key={i} onClick={() => setCurrentPhotoIndex(i)} 
                      className={`w-12 h-12 rounded overflow-hidden shrink-0 border-2 ${currentPhotoIndex === i ? 'border-emerald-500' : 'border-transparent'}`}>
                      <img src={getPhotoUrl(p)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {alert.description && <p className="text-slate-700 bg-slate-50 rounded-lg p-3 text-sm italic">"{alert.description}"</p>}

          {/* Voice Note */}
          {alert.voiceNote && (
            <button onClick={() => toggleAudio(alert.voiceNote)} className="w-full flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${playingAudio === alert.voiceNote ? 'bg-violet-500' : 'bg-violet-300'}`}>
                {playingAudio === alert.voiceNote ? <PauseIcon className="text-white" style={{ fontSize: 18 }} /> : <PlayArrowIcon className="text-white" style={{ fontSize: 18 }} />}
              </div>
              <span className="font-medium text-slate-700 text-sm">{playingAudio === alert.voiceNote ? 'Playing...' : 'Play voice recording'}</span>
            </button>
          )}

          {/* Votes */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 rounded-lg border border-green-100"><ThumbUpIcon className="text-green-500" style={{ fontSize: 16 }} /><span className="font-bold text-slate-700">{alert.votesUp || 0}</span></div>
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 rounded-lg border border-red-100"><ThumbDownIcon className="text-red-500" style={{ fontSize: 16 }} /><span className="font-bold text-slate-700">{alert.votesDown || 0}</span></div>
          </div>

          {/* Comments Section */}
          {comments && comments.length > 0 && (
            <div className="bg-slate-50 rounded-xl">
              <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-2">
                <ChatBubbleOutlineIcon className="text-slate-500" style={{ fontSize: 16 }} />
                <span className="font-semibold text-slate-700 text-sm">Comments ({comments.length})</span>
              </div>
              <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                {comments.map((comment, idx) => (
                  <div key={comment.id || idx} className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${comment.isOfficial ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {comment.isOfficial ? <LocalPoliceIcon style={{ fontSize: 12 }} /> : comment.author?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-semibold text-slate-800 text-xs">{comment.author || 'Anonymous'}</span>
                          {comment.isOfficial && <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-medium">Official</span>}
                        </div>
                        <p className="text-slate-600 text-xs">{comment.text}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{comment.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Link */}
          {alert.lat && alert.lng && (
            <a href={`https://www.google.com/maps?q=${alert.lat},${alert.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium"><LocationOnIcon style={{ fontSize: 16 }} /> Open in Google Maps</a>
          )}

          {/* Admin Actions */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <button onClick={() => handleVerify(alert.id)} className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 ${alert.verified ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
              <VerifiedIcon style={{ fontSize: 16 }} /> {alert.verified ? 'Remove Verified Badge' : 'Mark as Verified'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setShowMobileDetail(false); openEditModal(alert) }} className="py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm flex items-center justify-center gap-1"><EditIcon style={{ fontSize: 16 }} /> Edit</button>
              <button onClick={() => { handleDelete(alert.id); setShowMobileDetail(false) }} className="py-2.5 rounded-xl bg-red-50 text-red-600 font-medium text-sm flex items-center justify-center gap-1 border border-red-200"><DeleteIcon style={{ fontSize: 16 }} /> Delete</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setShowMobileDetail(false); setActionModal({ open: true, type: 'warning', alert }) }} className="py-2 rounded-xl bg-amber-50 text-amber-700 font-medium text-sm border border-amber-200 flex items-center justify-center gap-1"><WarningAmberIcon style={{ fontSize: 14 }} /> Warn User</button>
              <button onClick={() => { setShowMobileDetail(false); setActionModal({ open: true, type: 'ban', alert }) }} className="py-2 rounded-xl bg-red-50 text-red-600 font-medium text-sm border border-red-200 flex items-center justify-center gap-1"><BlockIcon style={{ fontSize: 14 }} /> Ban User</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Alert Types
const ALERT_TYPES = [
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

// Edit Modal
function EditModal({ editModal, setEditModal, saveEdit }) {
  const severityOptions = [
    { value: 'Low', label: 'Low Priority', color: 'bg-emerald-500', desc: 'Minor issue, informational' },
    { value: 'Medium', label: 'Medium Priority', color: 'bg-amber-500', desc: 'Moderate concern, use caution' },
    { value: 'High', label: 'High Priority', color: 'bg-red-500', desc: 'Urgent, immediate attention needed' }
  ]

  const photos = editModal.data.photos || []
  const voiceNote = editModal.data.voiceNote

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    setEditModal(p => ({ ...p, data: { ...p.data, photos: newPhotos } }))
  }

  const removeVoiceNote = () => {
    setEditModal(p => ({ ...p, data: { ...p.data, voiceNote: null } }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditModal({ open: false, data: {} })}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <EditIcon className="text-white" style={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Edit Alert</h3>
                <p className="text-emerald-100 text-xs">Modify alert details and media</p>
              </div>
            </div>
            <button onClick={() => setEditModal({ open: false, data: {} })} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <CloseIcon className="text-white" style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Alert Type Dropdown */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <ReportIcon className="text-slate-400" style={{ fontSize: 16 }} />
              Alert Type
            </label>
            <select 
              value={editModal.data.type || ''} 
              onChange={(e) => setEditModal(p => ({ ...p, data: { ...p.data, type: e.target.value } }))} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
            >
              <option value="" disabled>Select alert type...</option>
              {ALERT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <ChatBubbleOutlineIcon className="text-slate-400" style={{ fontSize: 16 }} />
              Description
            </label>
            <textarea 
              value={editModal.data.description || ''} 
              onChange={(e) => setEditModal(p => ({ ...p, data: { ...p.data, description: e.target.value } }))} 
              rows={3} 
              placeholder="Describe the alert in detail..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-slate-800 placeholder-slate-400" 
            />
            <p className="text-xs text-slate-400 mt-1">{(editModal.data.description || '').length} characters</p>
          </div>

          {/* Severity Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <WarningAmberIcon className="text-slate-400" style={{ fontSize: 16 }} />
              Severity Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {severityOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditModal(p => ({ ...p, data: { ...p.data, severity: opt.value } }))}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                    editModal.data.severity === opt.value 
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${opt.color}`} />
                    <span className="font-semibold text-slate-800 text-sm">{opt.value}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{opt.desc}</p>
                  {editModal.data.severity === opt.value && (
                    <div className="absolute top-2 right-2">
                      <CheckCircleIcon className="text-emerald-500" style={{ fontSize: 16 }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Photos Management */}
          {photos.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <PhotoLibraryIcon className="text-slate-400" style={{ fontSize: 16 }} />
                Photos ({photos.length})
              </label>
              <div className="flex gap-3 flex-wrap">
                {photos.map((photo, index) => {
                  const photoUrl = getPhotoUrl(photo)
                  return (
                    <div key={index} className="relative group">
                      <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100">
                        {photoUrl ? (
                          <img src={photoUrl} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon style={{ fontSize: 24 }} />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <CloseIcon style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2">Hover over a photo and click × to remove it</p>
            </div>
          )}

          {/* Voice Note Management */}
          {voiceNote && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <MicIcon className="text-slate-400" style={{ fontSize: 16 }} />
                Voice Recording
              </label>
              <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center shrink-0">
                  <MicIcon className="text-white" style={{ fontSize: 18 }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-700 text-sm">Voice note attached</p>
                  <p className="text-xs text-slate-500">Audio recording from reporter</p>
                </div>
                <button
                  type="button"
                  onClick={removeVoiceNote}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <DeleteIcon style={{ fontSize: 14 }} />
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Location (Read-only) */}
          {editModal.data.location && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <LocationOnIcon className="text-slate-400" style={{ fontSize: 14 }} />
                Location (cannot be edited)
              </label>
              <p className="text-slate-700 text-sm">{editModal.data.location}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button 
            onClick={() => setEditModal({ open: false, data: {} })} 
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={saveEdit} 
            className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <SaveIcon style={{ fontSize: 18 }} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// Action Modal
function ActionModal({ actionModal, setActionModal }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setActionModal({ open: false, type: null, alert: null })}>
      <div className="bg-white rounded-xl w-full max-w-sm p-5 text-center" onClick={e => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${actionModal.type === 'ban' ? 'bg-red-100' : 'bg-yellow-100'}`}>
          {actionModal.type === 'ban' ? <BlockIcon className="text-red-500" /> : <WarningAmberIcon className="text-yellow-600" />}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">{actionModal.type === 'ban' ? 'Ban User' : 'Send Warning'}</h3>
        <p className="text-slate-500 text-sm mb-4">{actionModal.type === 'ban' ? `Ban @${actionModal.alert?.contributor || 'user'} from submitting?` : `Warn @${actionModal.alert?.contributor || 'user'}?`}</p>
        <div className="flex gap-2">
          <button onClick={() => setActionModal({ open: false, type: null, alert: null })} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-600">Cancel</button>
          <button onClick={() => { console.log(`${actionModal.type} user`); setActionModal({ open: false, type: null, alert: null }) }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${actionModal.type === 'ban' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
            {actionModal.type === 'ban' ? 'Ban' : 'Warn'}
          </button>
        </div>
      </div>
    </div>
  )
}
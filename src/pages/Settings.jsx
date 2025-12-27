import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import NotificationsIcon from '@mui/icons-material/Notifications'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VibrationIcon from '@mui/icons-material/Vibration'
import MapIcon from '@mui/icons-material/Map'
import SpeedIcon from '@mui/icons-material/Speed'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import StorageIcon from '@mui/icons-material/Storage'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SecurityIcon from '@mui/icons-material/Security'
import LanguageIcon from '@mui/icons-material/Language'
import SaveIcon from '@mui/icons-material/Save'
import RestoreIcon from '@mui/icons-material/Restore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TuneIcon from '@mui/icons-material/Tune'
import RouteIcon from '@mui/icons-material/Route'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip'
import DataUsageIcon from '@mui/icons-material/DataUsage'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import CloseIcon from '@mui/icons-material/Close'
import HomeIcon from '@mui/icons-material/Home'
import RadarIcon from '@mui/icons-material/Radar'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import MenuIcon from '@mui/icons-material/Menu'

export default function Settings() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('notifications')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('roadguard_settings')
    return saved ? JSON.parse(saved) : {
      notificationsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      alertZoneRadius: 500,
      dangerZoneRadius: 100,
      defaultZoom: 13,
      showTrafficLayer: false,
      autoFollowLocation: true,
      avoidHighways: false,
      avoidTolls: false,
      preferSafeRoutes: true,
      darkMode: false,
      showHazardLabels: true,
      markerSize: 'medium',
      distanceUnit: 'km',
      speedUnit: 'kmh',
      shareLocation: true,
      anonymousReporting: false,
      cacheRoutes: true,
      offlineMode: false
    }
  })
  
  const [saved, setSaved] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setShowMobileMenu(false)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const saveSettings = () => {
    localStorage.setItem('roadguard_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  const resetToDefaults = () => {
    const defaults = {
      notificationsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      alertZoneRadius: 500,
      dangerZoneRadius: 100,
      defaultZoom: 13,
      showTrafficLayer: false,
      autoFollowLocation: true,
      avoidHighways: false,
      avoidTolls: false,
      preferSafeRoutes: true,
      darkMode: false,
      showHazardLabels: true,
      markerSize: 'medium',
      distanceUnit: 'km',
      speedUnit: 'kmh',
      shareLocation: true,
      anonymousReporting: false,
      cacheRoutes: true,
      offlineMode: false
    }
    setSettings(defaults)
    localStorage.setItem('roadguard_settings', JSON.stringify(defaults))
  }
  
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
    }
  }
  
  const clearCache = () => {
    localStorage.removeItem('roadguard_route_cache')
    localStorage.removeItem('roadguard_search_history')
    alert('Cache cleared successfully!')
  }
  
  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))

  const sections = [
    { id: 'notifications', label: 'Notifications', icon: NotificationsIcon, color: 'from-blue-500 to-indigo-600' },
    { id: 'geofence', label: 'GeoFence Zones', icon: RadarIcon, color: 'from-amber-500 to-orange-600' },
    { id: 'map', label: 'Map & Display', icon: MapIcon, color: 'from-emerald-500 to-teal-600' },
    { id: 'navigation', label: 'Navigation', icon: RouteIcon, color: 'from-purple-500 to-pink-600' },
    { id: 'units', label: 'Units & Format', icon: LanguageIcon, color: 'from-cyan-500 to-blue-600' },
    { id: 'privacy', label: 'Privacy', icon: PrivacyTipIcon, color: 'from-rose-500 to-red-600' },
    { id: 'data', label: 'Data Management', icon: DataUsageIcon, color: 'from-slate-500 to-slate-700' },
    { id: 'about', label: 'About', icon: InfoOutlinedIcon, color: 'from-indigo-500 to-purple-600' },
  ]

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId)
    if (isMobile) setShowMobileMenu(false)
  }

  const currentSection = sections.find(s => s.id === activeSection)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-emerald-50/30">
      {/* Desktop Layout */}
      {!isMobile && (
        <div className="min-h-screen flex">
          {/* Desktop Sidebar - Fixed Left */}
          <aside className="w-72 xl:w-80 h-screen sticky top-0 bg-white border-r border-slate-200/80 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/')}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <ArrowBackIcon className="text-slate-600" style={{ fontSize: 20 }} />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-800">Road<span className="text-emerald-600">Guard</span></span>
                    <p className="text-[11px] text-slate-400 -mt-0.5">Settings</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex-1 p-3 overflow-y-auto">
              <div className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? 'bg-emerald-50 border border-emerald-200' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        isActive 
                          ? `bg-gradient-to-br ${section.color} shadow-md` 
                          : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}>
                        <Icon style={{ fontSize: 18 }} className={isActive ? 'text-white' : 'text-slate-500'} />
                      </div>
                      <span className={`font-medium text-sm flex-1 text-left ${isActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {section.label}
                      </span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </nav>
            
            {/* Sidebar Footer */}
            <div className="p-3 border-t border-slate-100">
              <button 
                onClick={resetToDefaults}
                className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
              >
                <RestoreIcon style={{ fontSize: 16 }} />
                Reset Defaults
              </button>
            </div>
          </aside>
          
          {/* Desktop Content */}
          <main className="flex-1 min-h-screen bg-slate-50/50">
            {/* Top Header Bar */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
              <div className="h-16 flex items-center justify-center">
                <div className="w-full max-w-4xl px-6 xl:px-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {currentSection && (
                      <>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentSection.color} flex items-center justify-center shadow-lg`}>
                          {(() => {
                            const Icon = currentSection.icon
                            return <Icon className="text-white" style={{ fontSize: 20 }} />
                          })()}
                        </div>
                        <div>
                          <h1 className="text-lg font-bold text-slate-800">{currentSection.label}</h1>
                          <p className="text-xs text-slate-500">Configure your preferences</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate('/')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-medium text-sm flex items-center gap-2 transition-all duration-200 active:scale-95"
                  >
                    <HomeIcon style={{ fontSize: 18 }} />
                    Back to Map
                  </button>
                  <button 
                    onClick={saveSettings}
                    disabled={saved}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300 shadow-lg active:scale-95 ${
                      saved 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]'
                    }`}
                  >
                    {saved ? <CheckCircleIcon style={{ fontSize: 18 }} /> : <SaveIcon style={{ fontSize: 18 }} />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
                </div>
              </div>
            </header>
            
            {/* Content Area */}
            <div className="p-6 xl:p-8 flex justify-center">
              <div className="w-full max-w-4xl">
                <div className="space-y-5 animate-fadeIn">
                  {activeSection === 'notifications' && (
                    <NotificationsSection 
                      settings={settings} 
                      toggle={toggle} 
                      notificationPermission={notificationPermission}
                      requestNotificationPermission={requestNotificationPermission}
                    />
                  )}
                  
                  {activeSection === 'geofence' && (
                    <GeoFenceSection settings={settings} updateSetting={updateSetting} />
                  )}
                  
                  {activeSection === 'map' && (
                    <MapSection settings={settings} toggle={toggle} updateSetting={updateSetting} />
                  )}
                  
                  {activeSection === 'navigation' && (
                    <NavigationSection settings={settings} toggle={toggle} />
                  )}
                  
                  {activeSection === 'units' && (
                    <UnitsSection settings={settings} updateSetting={updateSetting} />
                  )}
                  
                  {activeSection === 'privacy' && (
                    <PrivacySection settings={settings} toggle={toggle} />
                  )}
                  
                  {activeSection === 'data' && (
                    <DataSection settings={settings} toggle={toggle} clearCache={clearCache} />
                  )}
                  
                  {activeSection === 'about' && (
                    <AboutSection />
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
      
      {/* Mobile Layout */}
      {isMobile && (
        <>
          {/* Mobile Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 px-4 py-3 safe-area-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95"
                >
                  <ArrowBackIcon className="text-slate-600" style={{ fontSize: 22 }} />
                </button>
                <button 
                  onClick={() => setShowMobileMenu(true)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95"
                >
                  <MenuIcon className="text-slate-600" style={{ fontSize: 22 }} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <TuneIcon className="text-white" style={{ fontSize: 18 }} />
                  </div>
                  <span className="text-base font-bold text-slate-800">Settings</span>
                </div>
              </div>
              <button 
                onClick={saveSettings}
                disabled={saved}
                className={`px-3 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all duration-300 active:scale-95 ${
                  saved 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                }`}
              >
                {saved ? <CheckCircleIcon style={{ fontSize: 16 }} /> : <SaveIcon style={{ fontSize: 16 }} />}
                <span className="text-xs">{saved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </header>
          
          {/* Mobile Slide Menu */}
          <>
            {/* Backdrop */}
            <div 
              className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Menu Panel */}
            <aside className={`fixed top-0 left-0 h-full w-[85%] max-w-xs bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
              {/* Menu Header */}
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-500 to-teal-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <span className="font-bold text-white">RoadGuard</span>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <CloseIcon className="text-white" style={{ fontSize: 22 }} />
                </button>
              </div>
              
              {/* Menu Items */}
              <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-8rem)]">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-emerald-50 border border-emerald-200' 
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive 
                          ? `bg-gradient-to-br ${section.color}` 
                          : 'bg-slate-100'
                      }`}>
                        <Icon style={{ fontSize: 16 }} className={isActive ? 'text-white' : 'text-slate-500'} />
                      </div>
                      <span className={`font-medium text-sm ${isActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {section.label}
                      </span>
                    </button>
                  )
                })}
              </nav>
              
              {/* Menu Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100 bg-white">
                <button 
                  onClick={resetToDefaults}
                  className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 font-medium text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <RestoreIcon style={{ fontSize: 16 }} />
                  Reset Defaults
                </button>
              </div>
            </aside>
          </>
          
          {/* Mobile Content */}
          <main className="pt-16 px-4 pb-8 min-h-screen">
            {/* Section Header Card */}
            {currentSection && (
              <div className={`mt-4 mb-5 bg-gradient-to-r ${currentSection.color} rounded-2xl p-4 shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    {(() => {
                      const Icon = currentSection.icon
                      return <Icon className="text-white" style={{ fontSize: 24 }} />
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{currentSection.label}</h2>
                    <p className="text-white/70 text-xs">Tap menu to switch sections</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Settings Content */}
            <div className="space-y-4 animate-fadeIn">
              {activeSection === 'notifications' && (
                <NotificationsSection 
                  settings={settings} 
                  toggle={toggle} 
                  notificationPermission={notificationPermission}
                  requestNotificationPermission={requestNotificationPermission}
                />
              )}
              
              {activeSection === 'geofence' && (
                <GeoFenceSection settings={settings} updateSetting={updateSetting} />
              )}
              
              {activeSection === 'map' && (
                <MapSection settings={settings} toggle={toggle} updateSetting={updateSetting} />
              )}
              
              {activeSection === 'navigation' && (
                <NavigationSection settings={settings} toggle={toggle} />
              )}
              
              {activeSection === 'units' && (
                <UnitsSection settings={settings} updateSetting={updateSetting} />
              )}
              
              {activeSection === 'privacy' && (
                <PrivacySection settings={settings} toggle={toggle} />
              )}
              
              {activeSection === 'data' && (
                <DataSection settings={settings} toggle={toggle} clearCache={clearCache} />
              )}
              
              {activeSection === 'about' && (
                <AboutSection />
              )}
            </div>
          </main>
        </>
      )}
    </div>
  )
}

// ============ Section Components ============

function NotificationsSection({ settings, toggle, notificationPermission, requestNotificationPermission }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Browser Permissions" icon={NotificationsActiveIcon}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              notificationPermission === 'granted' ? 'bg-emerald-100' : 
              notificationPermission === 'denied' ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              {notificationPermission === 'granted' ? (
                <CheckCircleIcon className="text-emerald-600" />
              ) : notificationPermission === 'denied' ? (
                <CloseIcon className="text-red-600" />
              ) : (
                <NotificationsNoneIcon className="text-amber-600" />
              )}
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Browser Notifications</div>
              <div className={`text-xs font-medium ${
                notificationPermission === 'granted' ? 'text-emerald-600' : 
                notificationPermission === 'denied' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {notificationPermission === 'granted' ? '✓ Enabled' : 
                 notificationPermission === 'denied' ? '✗ Blocked in browser' : '○ Not configured'}
              </div>
            </div>
          </div>
          {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
            <button 
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 active:scale-95 w-full sm:w-auto"
            >
              Enable Now
            </button>
          )}
        </div>
      </SectionCard>
      
      <SectionCard title="Alert Settings" icon={NotificationsIcon}>
        <div className="space-y-1">
          <ToggleItem
            icon={<NotificationsIcon />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="Hazard Alerts"
            description="Get notified when approaching hazards"
            enabled={settings.notificationsEnabled}
            onToggle={() => toggle('notificationsEnabled')}
          />
          <ToggleItem
            icon={<VolumeUpIcon />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            label="Sound Alerts"
            description="Play audio warning in danger zone"
            enabled={settings.soundEnabled}
            onToggle={() => toggle('soundEnabled')}
          />
          <ToggleItem
            icon={<VibrationIcon />}
            iconBg="bg-pink-100"
            iconColor="text-pink-600"
            label="Vibration"
            description="Vibrate device for urgent alerts"
            enabled={settings.vibrationEnabled}
            onToggle={() => toggle('vibrationEnabled')}
          />
        </div>
      </SectionCard>
    </div>
  )
}

function GeoFenceSection({ settings, updateSetting }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Zone Configuration" icon={RadarIcon}>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
              <WarningAmberIcon className="text-amber-600" style={{ fontSize: 20 }} />
            </div>
            <div className="text-sm text-amber-800">
              <strong>How GeoFence works:</strong> Monitors your location and alerts when approaching hazards. Alert Zone = early warning, Danger Zone = urgent alert.
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          <SliderCard
            label="Alert Zone Radius"
            description="Distance to start showing warnings"
            value={settings.alertZoneRadius}
            min={200}
            max={1000}
            step={50}
            unit="m"
            color="amber"
            icon="📍"
            onChange={(v) => updateSetting('alertZoneRadius', v)}
          />
          
          <SliderCard
            label="Danger Zone Radius"
            description="Critical warning distance"
            value={settings.dangerZoneRadius}
            min={50}
            max={200}
            step={10}
            unit="m"
            color="red"
            icon="⚠️"
            onChange={(v) => updateSetting('dangerZoneRadius', v)}
          />
        </div>
        
        {/* Visual Zone Preview */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <div className="text-xs font-medium text-slate-500 mb-3 text-center">Live Zone Preview</div>
          <div className="relative h-28 sm:h-32 flex items-center justify-center">
            <div 
              className="absolute rounded-full bg-amber-200/40 border-2 border-amber-400 border-dashed transition-all duration-500"
              style={{ 
                width: `${Math.min(settings.alertZoneRadius / 5, 100)}px`, 
                height: `${Math.min(settings.alertZoneRadius / 5, 100)}px` 
              }}
            />
            <div 
              className="absolute rounded-full bg-red-200/50 border-2 border-red-400 transition-all duration-500"
              style={{ 
                width: `${Math.min(settings.dangerZoneRadius / 2, 50)}px`, 
                height: `${Math.min(settings.dangerZoneRadius / 2, 50)}px` 
              }}
            />
            <div className="absolute w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/50 z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex justify-center gap-4 sm:gap-6 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-600">Alert: {settings.alertZoneRadius}m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-slate-600">Danger: {settings.dangerZoneRadius}m</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function MapSection({ settings, toggle, updateSetting }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Map Preferences" icon={MapIcon}>
        <div className="space-y-1">
          <ToggleItem
            icon={<MyLocationIcon />}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            label="Auto-Follow Location"
            description="Keep map centered on your position"
            enabled={settings.autoFollowLocation}
            onToggle={() => toggle('autoFollowLocation')}
          />
          <ToggleItem
            icon={<WarningAmberIcon />}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            label="Show Hazard Labels"
            description="Display hazard type text on markers"
            enabled={settings.showHazardLabels}
            onToggle={() => toggle('showHazardLabels')}
          />
        </div>
      </SectionCard>
      
      <SectionCard title="Display Options" icon={VisibilityIcon}>
        <div className="space-y-5">
          <SliderCard
            label="Default Zoom Level"
            description="Initial map zoom when opening app"
            value={settings.defaultZoom}
            min={10}
            max={18}
            step={1}
            unit=""
            color="emerald"
            icon="🔍"
            onChange={(v) => updateSetting('defaultZoom', v)}
          />
          
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-medium text-slate-800 text-sm">Marker Size</div>
                <div className="text-xs text-slate-500">Hazard marker display size</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => updateSetting('markerSize', size)}
                  className={`py-2.5 sm:py-3 rounded-xl font-medium text-sm capitalize transition-all duration-200 ${
                    settings.markerSize === size
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 active:scale-95'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function NavigationSection({ settings, toggle }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Route Preferences" icon={RouteIcon}>
        <div className="space-y-1">
          <ToggleItem
            icon={<SecurityIcon />}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            label="Prefer Safe Routes"
            description="Auto-select routes with fewer hazards"
            enabled={settings.preferSafeRoutes}
            onToggle={() => toggle('preferSafeRoutes')}
            highlight={true}
          />
          <ToggleItem
            icon={<SpeedIcon />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="Avoid Highways"
            description="Prefer local roads over highways"
            enabled={settings.avoidHighways}
            onToggle={() => toggle('avoidHighways')}
          />
          <ToggleItem
            icon={<SpeedIcon />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            label="Avoid Tolls"
            description="Skip toll roads when possible"
            enabled={settings.avoidTolls}
            onToggle={() => toggle('avoidTolls')}
          />
        </div>
      </SectionCard>
    </div>
  )
}

function UnitsSection({ settings, updateSetting }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Measurement Units" icon={LanguageIcon}>
        <div className="space-y-4">
          <SelectCard
            label="Distance Unit"
            description="How distances are displayed"
            value={settings.distanceUnit}
            options={[
              { value: 'km', label: 'Kilometers', icon: '🌍' },
              { value: 'miles', label: 'Miles', icon: '🇺🇸' }
            ]}
            onChange={(v) => updateSetting('distanceUnit', v)}
          />
          
          <SelectCard
            label="Speed Unit"
            description="How speed is displayed"
            value={settings.speedUnit}
            options={[
              { value: 'kmh', label: 'km/h', icon: '🚗' },
              { value: 'mph', label: 'mph', icon: '🏎️' }
            ]}
            onChange={(v) => updateSetting('speedUnit', v)}
          />
        </div>
      </SectionCard>
    </div>
  )
}

function PrivacySection({ settings, toggle }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Privacy Settings" icon={PrivacyTipIcon}>
        <div className="p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl border border-rose-100 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 rounded-lg shrink-0">
              <SecurityIcon className="text-rose-600" style={{ fontSize: 20 }} />
            </div>
            <div className="text-sm text-rose-800">
              <strong>Your privacy matters:</strong> Location data is only used for hazard alerts and navigation. We never sell your data.
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <ToggleItem
            icon={<MyLocationIcon />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="Share Location"
            description="Allow location for hazard proximity"
            enabled={settings.shareLocation}
            onToggle={() => toggle('shareLocation')}
          />
          <ToggleItem
            icon={<SecurityIcon />}
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
            label="Anonymous Reporting"
            description="Hide your name when reporting hazards"
            enabled={settings.anonymousReporting}
            onToggle={() => toggle('anonymousReporting')}
          />
        </div>
      </SectionCard>
    </div>
  )
}

function DataSection({ settings, toggle, clearCache }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Storage Settings" icon={StorageIcon}>
        <ToggleItem
          icon={<StorageIcon />}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          label="Cache Routes"
          description="Save recent routes for faster loading"
          enabled={settings.cacheRoutes}
          onToggle={() => toggle('cacheRoutes')}
        />
      </SectionCard>
      
      <SectionCard title="Data Actions" icon={DataUsageIcon}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={clearCache}
            className="p-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          >
            <DeleteOutlineIcon style={{ fontSize: 20 }} />
            Clear Cache
          </button>
          
          <button 
            className="p-4 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          >
            <DeleteOutlineIcon style={{ fontSize: 20 }} />
            Clear All Data
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="About RoadGuard" icon={InfoOutlinedIcon}>
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-4">
            <MapIcon className="text-white" style={{ fontSize: 38 }} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">RoadGuard</h3>
          <p className="text-slate-500 text-sm mb-4">Safe Roads, Smart Navigation</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            Version 1.0.0
          </div>
        </div>
        
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <InfoRow label="Developer" value="Team RoadGuard" />
          <InfoRow label="Last Updated" value="December 2025" />
          <InfoRow label="Build" value="Production" />
        </div>
      </SectionCard>
      
      <SectionCard title="Links" icon={LanguageIcon}>
        <div className="grid grid-cols-2 gap-2">
          {['Privacy Policy', 'Terms of Use', 'Help Center', 'Contact Us'].map((label) => (
            <button 
              key={label}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-medium text-sm transition-all duration-200 active:scale-[0.98]"
            >
              {label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ============ Reusable Components ============

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-xl">
          <Icon className="text-slate-600" style={{ fontSize: 18 }} />
        </div>
        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{title}</h3>
      </div>
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  )
}

function ToggleItem({ icon, iconBg, iconColor, label, description, enabled, onToggle, highlight }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${highlight && enabled ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="min-w-0">
          <div className="font-medium text-slate-800 text-sm truncate">{label}</div>
          <div className="text-xs text-slate-500 truncate">{description}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ml-2 ${
          enabled 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30' 
            : 'bg-slate-200'
        }`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}>
          {enabled && (
            <svg className="text-emerald-500 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </button>
    </div>
  )
}

function SliderCard({ label, description, value, min, max, step, unit, color, icon, onChange }) {
  const colorMap = {
    amber: { bg: 'from-amber-500 to-orange-500', accent: '#f59e0b' },
    red: { bg: 'from-red-500 to-rose-500', accent: '#ef4444' },
    emerald: { bg: 'from-emerald-500 to-teal-500', accent: '#10b981' }
  }
  
  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{icon}</span>
            <span className="font-medium text-slate-800 text-sm">{label}</span>
          </div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${colorMap[color].bg} text-white font-bold text-sm shadow-lg shrink-0`}>
          {value}{unit}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: colorMap[color].accent }}
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

function SelectCard({ label, description, value, options, onChange }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="mb-3">
        <div className="font-medium text-slate-800 text-sm">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`py-2.5 sm:py-3 px-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              value === opt.value
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 active:scale-95'
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="font-medium text-slate-800 text-sm">{value}</span>
    </div>
  )
}

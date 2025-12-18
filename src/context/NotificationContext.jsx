import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const NotificationContext = createContext(null)

// Notification sound (using Web Audio API for reliability)
const createNotificationSound = () => {
  if (typeof window === 'undefined' || !window.AudioContext) return null
  
  return () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create a pleasant notification sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Two-tone notification sound
      oscillator.frequency.setValueAtTime(830, audioContext.currentTime) // First tone
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1) // Second tone (higher)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
    } catch (e) {
      // Fallback: do nothing if audio fails
    }
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]) // Persistent notification history for panel
  const [toasts, setToasts] = useState([]) // Temporary toasts for popup display
  const [browserPermission, setBrowserPermission] = useState('default')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const playSound = useRef(createNotificationSound())

  // Check browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission)
    }
  }, [])

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'denied'
    }
    
    try {
      const permission = await Notification.requestPermission()
      setBrowserPermission(permission)
      
      if (permission === 'granted') {
        // Show test notification
        showBrowserNotification('🔔 Notifications Enabled!', 'You will receive hazard alerts.')
      }
      
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback((title, body, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null
    }
    
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'roadguard-' + Date.now(),
        requireInteraction: false,
        silent: false,
        ...options
      })
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)
      
      return notification
    } catch (error) {
      console.error('Error showing browser notification:', error)
      return null
    }
  }, [])

  // Show in-app toast notification
  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const notification = { id, message, type, timestamp: Date.now() }
    
    // Add to persistent notifications (for panel)
    setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50
    
    // Add to temporary toasts (for popup display)
    setToasts(prev => [...prev, notification])
    
    // Auto remove toast after duration (but keep in notifications)
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(n => n.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  // Remove a notification from the panel
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Remove a toast (popup)
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(n => n.id !== id))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Notify about new hazard from OTHER users (not your own alerts)
  const notifyNewHazard = useCallback((alert, isFromOtherUser = true) => {
    // Only show notifications for alerts from OTHER users
    if (!isFromOtherUser) return
    
    const title = `📍 ${alert.type} Nearby`
    const body = `${alert.severity} severity hazard reported by ${alert.contributor || 'another user'}`
    
    // Play notification sound
    if (soundEnabled && playSound.current) {
      playSound.current()
    }
    
    // Show browser notification
    if (browserPermission === 'granted') {
      showBrowserNotification(title, body, {
        tag: 'hazard-' + (alert.id || alert.firebaseKey),
        data: { alertId: alert.id }
      })
    }
    
    // Show in-app toast with alert data for "tap to view"
    const toastType = alert.severity === 'High' ? 'error' : alert.severity === 'Medium' ? 'warning' : 'info'
    const message = `${alert.type} reported - ${alert.severity} severity`
    
    // Add to notifications with alert data
    const id = Date.now() + Math.random()
    const notification = { 
      id, 
      message, 
      type: toastType, 
      timestamp: Date.now(),
      alertData: alert,  // Include alert data for "tap to view on map"
      isHazardAlert: true
    }
    
    setNotifications(prev => [notification, ...prev].slice(0, 50))
    setToasts(prev => [...prev, notification])
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(n => n.id !== id))
    }, 5000)
    
  }, [browserPermission, showBrowserNotification, soundEnabled])

  const value = {
    notifications,       // Persistent list for notification panel
    toasts,              // Temporary popups
    browserPermission,
    requestPermission,
    showBrowserNotification,
    showToast,
    removeNotification,  // Remove from panel
    removeToast,         // Remove popup toast
    clearAll,
    notifyNewHazard,
    soundEnabled,
    setSoundEnabled
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
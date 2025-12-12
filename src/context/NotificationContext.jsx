A:\Roadgaurd\RoadGuard\src\context\NotificationContext.jsx:

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const NotificationContext = createContext(null)

// BroadcastChannel for cross-tab communication
const alertChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('roadguard-alerts') 
  : null

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
  const [notifications, setNotifications] = useState([])
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
    
    setNotifications(prev => [...prev, notification])
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }, [])

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Notify about new hazard (both browser + in-app + sound)
  const notifyNewHazard = useCallback((alert, isFromOtherTab = false) => {
    const title = '🚨 New Hazard Reported!'
    const body = `${alert.type} (${alert.severity})${isFromOtherTab ? ' - reported nearby' : ''}`
    
    // Play notification sound
    if (soundEnabled && playSound.current) {
      playSound.current()
    }
    
    // Show browser notification
    if (browserPermission === 'granted') {
      showBrowserNotification(title, body, {
        tag: 'hazard-' + alert.id,
        data: { alertId: alert.id }
      })
    }
    
    // Show in-app toast
    const toastType = alert.severity === 'High' ? 'error' : alert.severity === 'Medium' ? 'warning' : 'info'
    showToast(`${title} ${body}`, toastType)
  }, [browserPermission, showBrowserNotification, showToast, soundEnabled])

  // Broadcast alert to other tabs
  const broadcastAlert = useCallback((alert) => {
    if (alertChannel) {
      const broadcastData = {
        ...alert,
        photos: [], // Can't serialize File objects
        voiceNote: null, // Can't serialize Blob URLs
      }
      alertChannel.postMessage({ type: 'NEW_ALERT', alert: broadcastData })
    }
  }, [])

  // Note: BroadcastChannel listening is handled by AlertNotificationListener component
  // to avoid duplicate notifications

  const value = {
    notifications,
    browserPermission,
    requestPermission,
    showBrowserNotification,
    showToast,
    removeNotification,
    clearAll,
    notifyNewHazard,
    broadcastAlert,
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
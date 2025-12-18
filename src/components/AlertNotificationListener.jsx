import { useEffect, useRef } from 'react'
import { useNotifications } from '../context/NotificationContext'

/**
 * AlertNotificationListener
 * 
 * This component listens for new alerts from OTHER tabs (not local ones)
 * and displays notifications when a new alert is received.
 */
export default function AlertNotificationListener() {
  const { notifyNewHazard, requestPermission } = useNotifications()
  const hasRequestedPermission = useRef(false)

  useEffect(() => {
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true
      requestPermission()
    }

    const handleRemoteAlert = (event) => {
      const alert = event.detail
      if (alert) {
        notifyNewHazard(alert, true)
      }
    }

    window.addEventListener('roadguard-remote-alert', handleRemoteAlert)
    
    return () => {
      window.removeEventListener('roadguard-remote-alert', handleRemoteAlert)
    }
  }, [notifyNewHazard, requestPermission])

  // This component doesn't render anything
  return null
}
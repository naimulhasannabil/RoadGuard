// Cross-user alert communication using Firebase Realtime Database
// Firebase handles real-time notifications (instant push)
// PostgreSQL backend handles persistence (alerts, comments, media)

import { database } from '../config/firebase'
import { ref, push, onChildAdded, query, orderByChild, startAt, serverTimestamp } from 'firebase/database'

const alertsRef = ref(database, 'roadguard_alerts')
let unsubscribe = null
let startTime = Date.now()

// Push a new alert notification to Firebase (real-time push to ALL users)
// Note: Full alert data (with media) is stored in PostgreSQL
export async function broadcastAlert(alert) {
  try {
    // Only send essential data for real-time notification
    const alertData = {
      id: alert.id,
      backendId: alert.backendId, // PostgreSQL ID for fetching full details
      type: alert.type,
      severity: alert.severity,
      lat: alert.lat,
      lng: alert.lng,
      contributor: alert.contributor,
      timestamp: alert.timestamp,
      createdAt: alert.createdAt,
      broadcastedAt: Date.now(),
      serverTimestamp: serverTimestamp()
    }
    
    await push(alertsRef, alertData)
    return true
  } catch (error) {
    console.error('Error broadcasting alert:', error)
    return false
  }
}

// Subscribe to new alerts from Firebase (real-time notifications)
export function subscribeToAlerts(callback) {
  startTime = Date.now()
  
  const alertsQuery = query(
    alertsRef,
    orderByChild('broadcastedAt'),
    startAt(startTime)
  )
  
  unsubscribe = onChildAdded(alertsQuery, (snapshot) => {
    const alert = { firebaseKey: snapshot.key, ...snapshot.val() }
    callback({ type: 'NEW_ALERT', alert })
  })
  
  return () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }
}

// For backward compatibility
export function addAlertListener(callback) {
  return subscribeToAlerts(callback)
}

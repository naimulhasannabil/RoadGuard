// Custom React hooks for the application
import { useState, useEffect, useCallback } from 'react'
import alertService from '../services/alertService'
import userService from '../services/userService'
import { useAuth } from '../context/AuthContext'

// Hook for fetching and managing alerts
export function useAlerts(options = {}) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { nearby = false, lat, lng, radius = 5000 } = options

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    let result
    if (nearby && lat && lng) {
      result = await alertService.getNearbyAlerts(lat, lng, radius)
    } else {
      result = await alertService.getAllAlerts()
    }
    
    if (result.success) {
      setAlerts(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [nearby, lat, lng, radius])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const refetch = () => fetchAlerts()

  return { alerts, loading, error, refetch, setAlerts }
}

// Hook for user location
export function useUserLocation() {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      setLoading(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { location, loading, error }
}

// Hook for user profile
export function useUserProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      const result = await userService.getProfile()
      if (result.success) {
        setProfile(result.data)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [isAuthenticated])

  const updateProfile = async (data) => {
    const result = await userService.updateProfile(data)
    if (result.success) {
      setProfile(result.data)
    }
    return result
  }

  return { profile, loading, error, updateProfile }
}

// Hook for debouncing values
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Hook for local storage
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

// Hook for media queries
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

// Hook for checking if mobile
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)')
}

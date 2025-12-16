import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-routing-machine'
import { haversineMeters as getDistanceMeters } from '../context/AlertsContext'
import DirectionsIcon from '@mui/icons-material/Directions'
import MyLocationIcon from '@mui/icons-material/MyLocation'

// Mapbox Access Token - Get yours free at https://account.mapbox.com/access-tokens/
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYXJhZmF0aDAzIiwiYSI6ImNtajVzM29xNjFnMjEzZnF1dGc5b2FnZWMifQ.oJm2vPhYlRHzI0l03iSA_A'

import SwapVertIcon from '@mui/icons-material/SwapVert'
import WarningIcon from '@mui/icons-material/Warning'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import StraightenIcon from '@mui/icons-material/Straighten'
import CancelIcon from '@mui/icons-material/Cancel'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import SpeedIcon from '@mui/icons-material/Speed'

// Helper function to get route color based on hazard severity - defined once
const getRouteColor = (hazardScore, maxSeverity) => {
  if (hazardScore === 0) return { main: '#22c55e', highlight: '#4ade80' } // Green - Safe
  if (maxSeverity === 'Low') return { main: '#84cc16', highlight: '#a3e635' } // Lime - Low hazard
  if (maxSeverity === 'Medium') return { main: '#f97316', highlight: '#fb923c' } // Orange - Medium hazard
  return { main: '#ef4444', highlight: '#f87171' } // Red - High hazard
}

// Live tracking marker icon
const liveMarkerIcon = L.divIcon({
  html: `<div style="position: relative;">
    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6); border: 3px solid white; animation: pulse 2s infinite;">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
    <div style="position: absolute; top: -4px; left: -4px; width: 32px; height: 32px; border-radius: 50%; border: 2px solid #3b82f6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  className: 'live-location-marker'
})

// Real-time Location Tracker Component
function LiveLocationTracker({ isTracking, onLocationUpdate, destination }) {
  const map = useMap()
  const markerRef = useRef(null)
  const accuracyCircleRef = useRef(null)
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!isTracking) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      // Remove marker and circle
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
      if (accuracyCircleRef.current) {
        map.removeLayer(accuracyCircleRef.current)
        accuracyCircleRef.current = null
      }
      return
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords
        const latlng = L.latLng(latitude, longitude)

        // Update or create marker
        if (!markerRef.current) {
          markerRef.current = L.marker(latlng, { icon: liveMarkerIcon, zIndexOffset: 1000 })
          markerRef.current.addTo(map)
        } else {
          markerRef.current.setLatLng(latlng)
        }

        // Update or create accuracy circle
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle(latlng, {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 1
          })
          accuracyCircleRef.current.addTo(map)
        } else {
          accuracyCircleRef.current.setLatLng(latlng)
          accuracyCircleRef.current.setRadius(accuracy)
        }

        // Center map on current location
        map.panTo(latlng, { animate: true, duration: 0.5 })

        // Calculate distance to destination
        let distanceToDestination = null
        if (destination) {
          distanceToDestination = map.distance(latlng, L.latLng(destination.lat, destination.lng))
        }

        // Notify parent
        onLocationUpdate?.({
          lat: latitude,
          lng: longitude,
          accuracy,
          speed: speed || 0,
          heading: heading || 0,
          distanceToDestination
        })
      },
      (error) => {
        console.error('Tracking error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
      }
      if (accuracyCircleRef.current) {
        map.removeLayer(accuracyCircleRef.current)
      }
    }
  }, [map, isTracking, destination, onLocationUpdate])

  return null
}

// Decode polyline (Google's polyline algorithm) - used by Mapbox and OSRM
const decodePolyline = (encoded) => {
  const coords = []
  let index = 0, lat = 0, lng = 0
  
  while (index < encoded.length) {
    let shift = 0, result = 0, byte
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lat += dlat
    
    shift = 0
    result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lng += dlng
    
    coords.push([lat / 1e5, lng / 1e5])
  }
  return coords
}

// Draw routes on map - consolidated helper function
const drawRoutesOnMap = (map, scoredRoutes, bestRouteIdx, onRouteSelect, polylineRef, altPolylinesRef, markersRef) => {
  const bestRoute = scoredRoutes[bestRouteIdx]
  
  // Draw alternative routes first (so they appear behind the selected route)
  scoredRoutes.forEach((sr, idx) => {
    if (idx !== bestRouteIdx) {
      const altColors = getRouteColor(sr.hazardScore, sr.maxSeverity)
      const coords = sr.coordsArray || sr.coords
      
      const altLine = L.polyline(coords, {
        color: altColors.main,
        weight: 5,
        opacity: 0.6,
        dashArray: '10, 6',
        className: 'alternative-route'
      }).addTo(map)
      
      altLine.on('click', () => onRouteSelect?.(idx))
      
      altLine.on('mouseover', function() {
        this.setStyle({ weight: 7, opacity: 0.9 })
        const statusIcon = sr.hazardScore === 0 ? '✅' : sr.maxSeverity === 'High' ? '🔴' : sr.maxSeverity === 'Medium' ? '🟠' : '🟡'
        const statusText = sr.hazardScore === 0 ? 'Safe Route' : `${sr.maxSeverity} Risk Route`
        this.bindTooltip(`
          <div style="text-align: center; padding: 4px;">
            <strong>${statusIcon} ${statusText}</strong><br/>
            ${(sr.distance / 1000).toFixed(1)} km • ${Math.round(sr.time / 60)} min<br/>
            ${sr.hazardsOnRoute.length === 0 ? 'No hazards' : sr.hazardsOnRoute.length + ' hazard' + (sr.hazardsOnRoute.length !== 1 ? 's' : '')}<br/>
            <em style="color: #6366f1;">Click to select</em>
          </div>
        `, { permanent: false, direction: 'top' }).openTooltip()
      })
      altLine.on('mouseout', function() {
        this.setStyle({ weight: 5, opacity: 0.6 })
        this.closeTooltip()
      })
      
      altPolylinesRef.current.push(altLine)
    }
  })

  // Draw the selected/best route on top
  const routeColors = getRouteColor(bestRoute.hazardScore, bestRoute.maxSeverity)
  const bestCoords = bestRoute.coordsArray || bestRoute.coords
  
  polylineRef.current = L.polyline(bestCoords, {
    color: routeColors.main,
    weight: 7,
    opacity: 0.9,
    lineJoin: 'round',
    lineCap: 'round'
  }).addTo(map)

  // Add highlight line
  const highlightLine = L.polyline(bestCoords, {
    color: routeColors.highlight,
    weight: 4,
    opacity: 1
  }).addTo(map)
  markersRef.current.push(highlightLine)

  // Fit map to show all routes
  const allCoords = scoredRoutes.flatMap(sr => sr.coordsArray || sr.coords)
  map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] })
}

// Build route result object - consolidated helper function
const buildRouteResult = (scoredRoutes, bestRouteIdx, instructions = []) => {
  const bestRoute = scoredRoutes[bestRouteIdx]
  
  // Check for unavoidable hazards (present in ALL routes)
  const unavoidableHazards = []
  if (scoredRoutes.length > 1) {
    bestRoute.hazardsOnRoute.forEach(hazard => {
      const presentInAll = scoredRoutes.every(sr =>
        sr.hazardsOnRoute.some(h => h.id === hazard.id)
      )
      if (presentInAll) unavoidableHazards.push(hazard)
    })
  }

  const avoidableHazards = bestRoute.hazardsOnRoute.filter(h => 
    !unavoidableHazards.some(uh => uh.id === h.id)
  )

  const saferAlternatives = scoredRoutes
    .filter((sr, idx) => idx !== bestRouteIdx && sr.hazardScore < bestRoute.hazardScore)
    .map(sr => ({
      ...sr,
      hazardsAvoided: bestRoute.hazardsOnRoute.filter(h => 
        !sr.hazardsOnRoute.some(srh => srh.id === h.id)
      ),
      extraTime: sr.time - bestRoute.time,
      extraDistance: sr.distance - bestRoute.distance
    }))

  return {
    distance: bestRoute.distance,
    time: bestRoute.time,
    instructions: instructions.length > 0 ? instructions : (bestRoute.instructions || []),
    hazardsOnRoute: bestRoute.hazardsOnRoute,
    unavoidableHazards,
    avoidableHazards,
    alternativeRoutes: scoredRoutes.length,
    selectedRouteIndex: bestRouteIdx,
    hazardScore: bestRoute.hazardScore,
    avoidedHazards: scoredRoutes.length > 1 ?
      Math.max(...scoredRoutes.map(r => r.hazardScore)) - bestRoute.hazardScore : 0,
    saferAlternatives,
    allRoutes: scoredRoutes.map((sr, idx) => ({
      index: idx,
      distance: sr.distance,
      time: sr.time,
      hazardScore: sr.hazardScore,
      maxSeverity: sr.maxSeverity,
      hazardsOnRoute: sr.hazardsOnRoute,
      isSelected: idx === bestRouteIdx,
      isSafest: idx === 0
    }))
  }
}

// Routing Control Component (renders inside MapContainer)
function RoutingMachine({ start, end, hazards, onRouteFound, onRouteClear, selectedRouteIndex, onRouteSelect, isLiveTracking }) {
  const map = useMap()
  const routingControlRef = useRef(null)
  const polylineRef = useRef(null)
  const altPolylinesRef = useRef([])
  const markersRef = useRef([])
  const allRoutesRef = useRef([])

  useEffect(() => {
    if (!map) return

    // Clear existing route and markers
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current)
      } catch (e) {
        console.log('Error removing control:', e)
      }
      routingControlRef.current = null
    }
    
    // Clear polyline fallback
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }

    // Clear alternative routes
    altPolylinesRef.current.forEach(p => {
      try { map.removeLayer(p) } catch (e) {}
    })
    altPolylinesRef.current = []
    
    // Clear markers
    markersRef.current.forEach(m => {
      try { map.removeLayer(m) } catch (e) {}
    })
    markersRef.current = []

    // Clear stored routes
    allRoutesRef.current = []

    // If no start or end, just clear
    if (!start || !end) {
      onRouteClear?.()
      return
    }

    console.log('Creating route from', start, 'to', end)

    // Create start and end markers
    const startIcon = L.divIcon({
      html: `<div style="background: linear-gradient(135deg, #22c55e, #16a34a); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.5); border: 3px solid white;">
        <span style="color: white; font-weight: bold; font-size: 14px;">A</span>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: ''
    })
    
    const endIcon = L.divIcon({
      html: `<div style="background: linear-gradient(135deg, #ef4444, #dc2626); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5); border: 3px solid white;">
        <span style="color: white; font-weight: bold; font-size: 14px;">B</span>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: ''
    })
    
    // Only show start marker if NOT live tracking (to avoid duplicate with user location marker)
    const endMarker = L.marker([end.lat, end.lng], { icon: endIcon }).addTo(map)
    if (!isLiveTracking) {
      const startMarker = L.marker([start.lat, start.lng], { icon: startIcon }).addTo(map)
      markersRef.current = [startMarker, endMarker]
    } else {
      markersRef.current = [endMarker]
    }

    // Function to calculate hazard score for a route
    const calculateRouteHazardScore = (routeCoords) => {
      const hazardsOnRoute = []
      let totalScore = 0
      let maxSeverity = 'Low' // Track the highest severity hazard
      const severityWeights = { High: 10, Medium: 5, Low: 2 }
      const severityRank = { High: 3, Medium: 2, Low: 1 }
      
      console.log('Checking hazards:', hazards?.length || 0, 'hazards against route with', routeCoords.length, 'points')
      
      if (hazards && hazards.length > 0) {
        hazards.forEach(hazard => {
          let minDistance = Infinity
          // Find the closest point on the route to this hazard
          for (let coord of routeCoords) {
            const distance = getDistanceMeters(coord.lat, coord.lng, hazard.lat, hazard.lng)
            if (distance < minDistance) {
              minDistance = distance
            }
          }
          
          console.log(`Hazard "${hazard.type}" (${hazard.severity}) at [${hazard.lat}, ${hazard.lng}] - closest distance: ${minDistance.toFixed(1)}m`)
          
          // Only consider hazard if within 50m of route (accounts for GPS inaccuracy and road width)
          if (minDistance <= 50) {
            hazardsOnRoute.push({ ...hazard, distanceFromRoute: minDistance })
            totalScore += severityWeights[hazard.severity] || 3
            // Track highest severity
            if (severityRank[hazard.severity] > severityRank[maxSeverity]) {
              maxSeverity = hazard.severity
            }
            console.log(`  → DETECTED on route!`)
          } else {
            console.log(`  → Too far from route (>50m)`)
          }
        })
      }
      return { hazardsOnRoute, score: totalScore, maxSeverity }
    }

    // Mapbox Directions API - Primary routing (reliable, 100k free req/month)
    const fetchMapboxRoute = async (startPt, endPt) => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startPt.lng},${startPt.lat};${endPt.lng},${endPt.lat}?alternatives=true&geometries=polyline&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Mapbox API error: ${response.status}`)
      
      const data = await response.json()
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No routes found')
      
      console.log('Mapbox returned', data.routes.length, 'routes')
      
      // Process and score routes
      const scoredRoutes = data.routes.map((route, index) => {
        const coords = decodePolyline(route.geometry)
        const coordsForHazards = coords.map(c => ({ lat: c[0], lng: c[1] }))
        const { hazardsOnRoute, score, maxSeverity } = calculateRouteHazardScore(coordsForHazards)
        
        return {
          index, route, coords, coordsArray: coords,
          hazardsOnRoute, hazardScore: score, maxSeverity,
          distance: route.distance, time: route.duration,
          instructions: route.legs?.[0]?.steps?.map(step => ({
            text: step.maneuver?.instruction || '',
            distance: step.distance, time: step.duration,
            type: step.maneuver?.type, modifier: step.maneuver?.modifier
          })) || []
        }
      })

      // Sort by safety then time
      scoredRoutes.sort((a, b) => a.hazardScore !== b.hazardScore ? a.hazardScore - b.hazardScore : a.time - b.time)
      allRoutesRef.current = scoredRoutes

      const bestRouteIdx = selectedRouteIndex !== undefined && selectedRouteIndex < scoredRoutes.length ? selectedRouteIndex : 0
      
      // Draw routes and build result using helpers
      drawRoutesOnMap(map, scoredRoutes, bestRouteIdx, onRouteSelect, polylineRef, altPolylinesRef, markersRef)
      onRouteFound?.(buildRouteResult(scoredRoutes, bestRouteIdx))
      
      return true
    }

    // Main routing function - using Mapbox Directions API (reliable, 100k free requests/month)
    const createRoute = async () => {
      console.log('Starting route creation from', start, 'to', end)
      
      // Check if Mapbox token is configured
      if (MAPBOX_TOKEN && MAPBOX_TOKEN !== 'YOUR_MAPBOX_TOKEN_HERE') {
        console.log('Using Mapbox Directions API...')
        try {
          const mapboxResult = await fetchMapboxRoute(start, end)
          if (mapboxResult) {
            console.log('Mapbox routing successful!')
            return // Mapbox handled it
          }
        } catch (err) {
          console.log('Mapbox routing failed, trying OSRM fallback:', err.message)
        }
      } else {
        console.log('Mapbox token not configured, using OSRM...')
      }
      
      // Fallback to OSRM via leaflet-routing-machine
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(start.lat, start.lng),
          L.latLng(end.lat, end.lng)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://routing.openstreetmap.de/routed-car/route/v1',
          profile: 'driving',
          useHints: false,
          timeout: 30000, // 30 second timeout for slow connections
          // Request alternatives from OSRM
          requestParameters: {
            alternatives: 3, // Request up to 3 alternative routes
            steps: true,
            annotations: true,
            overview: 'full'
          }
        }),
        lineOptions: {
          styles: [], // We'll draw our own lines
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
        show: false, // Don't show the default itinerary panel
        addWaypoints: false, // Disable adding waypoints by clicking
        routeWhileDragging: false,
        fitSelectedRoutes: false, // We'll handle fitting ourselves
        showAlternatives: true,
        altLineOptions: {
          styles: [] // We'll draw our own alternative lines
        },
        createMarker: function() { return null; } // Don't create default markers, we have our own
      })

      // Handle route found event
      routingControlRef.current.on('routesfound', function(e) {
        const routes = e.routes
        console.log('OSRM routes found:', routes.length)
        
        if (routes.length > 0) {
          // Process and score routes
          const scoredRoutes = routes.map((route, index) => {
            const coords = route.coordinates.map(c => ({ lat: c.lat, lng: c.lng }))
            const { hazardsOnRoute, score, maxSeverity } = calculateRouteHazardScore(coords)
            return {
              index, route,
              coords: route.coordinates,
              coordsArray: route.coordinates.map(c => [c.lat, c.lng]),
              hazardsOnRoute, hazardScore: score, maxSeverity,
              distance: route.summary.totalDistance,
              time: route.summary.totalTime,
              instructions: route.instructions
            }
          })

          // Sort by safety then time
          scoredRoutes.sort((a, b) => a.hazardScore !== b.hazardScore ? a.hazardScore - b.hazardScore : a.time - b.time)
          allRoutesRef.current = scoredRoutes

          const bestRouteIdx = selectedRouteIndex !== undefined && selectedRouteIndex < scoredRoutes.length ? selectedRouteIndex : 0
          
          // Draw routes and build result using helpers
          drawRoutesOnMap(map, scoredRoutes, bestRouteIdx, onRouteSelect, polylineRef, altPolylinesRef, markersRef)
          onRouteFound?.(buildRouteResult(scoredRoutes, bestRouteIdx, scoredRoutes[bestRouteIdx].instructions))
        }
      })

      // Handle routing errors - try fallback
      routingControlRef.current.on('routingerror', function(e) {
        console.log('Routing error, trying fallback methods:', e.error)
        tryFallbackRouting()
      })

      // Add to map
      routingControlRef.current.addTo(map)
    }

    // Fallback routing using direct API calls
    const tryFallbackRouting = async () => {
      console.log('Attempting fallback routing...')
      
      const endpoints = [
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&alternatives=3&geometries=polyline&steps=true`,
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&alternatives=3&geometries=polyline&steps=true`
      ]
      
      let data = null
      for (const url of endpoints) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 20000)
          const response = await fetch(url, { signal: controller.signal })
          clearTimeout(timeoutId)
          
          if (response.ok) {
            const json = await response.json()
            if (json.code === 'Ok' && json.routes?.length) {
              console.log('Fallback success! Found', json.routes.length, 'routes')
              data = json
              break
            }
          }
        } catch (e) {
          console.log('Fallback endpoint failed:', e.message)
        }
      }
      
      if (data) {
        // Process and score routes
        const scoredRoutes = data.routes.map((route, index) => {
          const coords = decodePolyline(route.geometry)
          const coordsForHazards = coords.map(c => ({ lat: c[0], lng: c[1] }))
          const { hazardsOnRoute, score, maxSeverity } = calculateRouteHazardScore(coordsForHazards)
          return {
            index, route, coords, coordsArray: coords,
            hazardsOnRoute, hazardScore: score, maxSeverity,
            distance: route.distance, time: route.duration
          }
        })

        // Sort by safety then time
        scoredRoutes.sort((a, b) => a.hazardScore !== b.hazardScore ? a.hazardScore - b.hazardScore : a.time - b.time)
        allRoutesRef.current = scoredRoutes

        const bestRouteIdx = selectedRouteIndex !== undefined && selectedRouteIndex < scoredRoutes.length ? selectedRouteIndex : 0
        
        // Draw routes and build result using helpers
        drawRoutesOnMap(map, scoredRoutes, bestRouteIdx, onRouteSelect, polylineRef, altPolylinesRef, markersRef)
        onRouteFound?.(buildRouteResult(scoredRoutes, bestRouteIdx))
      } else {
        console.log('All routing methods failed, drawing straight line')
        drawStraightLineFallback()
      }
    }

    // Last resort - draw straight line (ONLY when routing services are completely unavailable)
    const drawStraightLineFallback = () => {
      console.warn('⚠️ FALLBACK: All routing services unavailable - showing straight line (NOT a real road route)')
      const latlngs = [
        [start.lat, start.lng],
        [end.lat, end.lng]
      ]
      
      // Use very distinct styling to show this is NOT a road route
      polylineRef.current = L.polyline(latlngs, {
        color: '#ef4444', // Red color to indicate problem
        weight: 4,
        opacity: 0.7,
        dashArray: '15, 10, 5, 10' // Distinctive dash pattern
      }).addTo(map)

      // Add a warning marker at midpoint
      const midLat = (start.lat + end.lat) / 2
      const midLng = (start.lng + end.lng) / 2
      const warningIcon = L.divIcon({
        html: `<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          ⚠️ Routing unavailable - Not actual road
        </div>`,
        iconSize: [180, 30],
        iconAnchor: [90, 15],
        className: ''
      })
      const warningMarker = L.marker([midLat, midLng], { icon: warningIcon }).addTo(map)
      markersRef.current.push(warningMarker)
      
      // Calculate straight-line distance
      const distance = getDistanceMeters(start.lat, start.lng, end.lat, end.lng)
      // Estimate time (assuming 40 km/h average speed)
      const time = (distance / 1000 / 40) * 3600
      
      onRouteFound?.({
        distance: distance,
        time: time,
        instructions: [],
        hazardsOnRoute: [],
        isFallback: true,
        isNotRoadRoute: true,
        fallbackMessage: '⚠️ Routing services unavailable. This is a straight line, NOT an actual road route. Please check your internet connection and try again.',
        allRoutes: []
      })
      
      // Fit bounds to show both points
      map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] })
    }

    // Execute the route creation
    createRoute()

    return () => {
      // Clean up routing control
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current)
        } catch (e) {}
        routingControlRef.current = null
      }
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current)
        polylineRef.current = null
      }
      // Clean up alternative routes
      altPolylinesRef.current.forEach(p => {
        try { map.removeLayer(p) } catch (e) {}
      })
      altPolylinesRef.current = []
      markersRef.current.forEach(m => {
        try { map.removeLayer(m) } catch (e) {}
      })
      markersRef.current = []
    }
  }, [map, start?.lat, start?.lng, end?.lat, end?.lng, hazards, selectedRouteIndex, isLiveTracking])

  return null
}

// Geocoding function using Nominatim (OpenStreetMap)
async function searchLocation(query) {
  if (!query || query.length < 3) return []
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RoadGuard-App'
        }
      }
    )
    const data = await response.json()
    return data.map(item => ({
      name: item.display_name,
      shortName: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      address: item.address
    }))
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}

// Map Click Handler for picking locations
function MapClickHandler({ isActive, pickingMode, onLocationPicked }) {
  const map = useMap()
  
  useEffect(() => {
    if (!isActive || !map) return
    
    const handleClick = (e) => {
      const { lat, lng } = e.latlng
      onLocationPicked({ lat, lng }, pickingMode)
    }
    
    // Change cursor to crosshair when picking
    map.getContainer().style.cursor = 'crosshair'
    map.on('click', handleClick)
    
    return () => {
      map.getContainer().style.cursor = ''
      map.off('click', handleClick)
    }
  }, [map, isActive, pickingMode, onLocationPicked])
  
  return null
}

// Main Navigation Panel Component
export function NavigationPanel({ userLocation, alerts, onStartChange, onEndChange, start, end, onLiveTrackingChange, liveTrackingData, onPickModeChange, pickingMode, routeInfo, onRouteSelect, isMobile = false }) {
  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLiveNavigating, setIsLiveNavigating] = useState(false)
  const [showAllRoutes, setShowAllRoutes] = useState(false)
  
  // Search suggestions state
  const [startSuggestions, setStartSuggestions] = useState([])
  const [endSuggestions, setEndSuggestions] = useState([])
  const [isSearchingStart, setIsSearchingStart] = useState(false)
  const [isSearchingEnd, setIsSearchingEnd] = useState(false)
  const [showStartSuggestions, setShowStartSuggestions] = useState(false)
  const [showEndSuggestions, setShowEndSuggestions] = useState(false)
  const searchTimeoutRef = useRef(null)

  // Update input when start/end changes from map picking
  useEffect(() => {
    if (start && pickingMode !== 'start') {
      // Only update if it looks like coordinates
      if (startInput === '' || startInput.startsWith('📍')) {
        setStartInput(`📍 ${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}`)
      }
    }
  }, [start])

  useEffect(() => {
    if (end && pickingMode !== 'end') {
      if (endInput === '' || endInput.startsWith('📍')) {
        setEndInput(`📍 ${end.lat.toFixed(4)}, ${end.lng.toFixed(4)}`)
      }
    }
  }, [end])

  // Toggle picking mode for start
  const togglePickStart = () => {
    if (pickingMode === 'start') {
      onPickModeChange?.(null)
    } else {
      onPickModeChange?.('start')
    }
  }

  // Toggle picking mode for end
  const togglePickEnd = () => {
    if (pickingMode === 'end') {
      onPickModeChange?.(null)
    } else {
      onPickModeChange?.('end')
    }
  }

  // Start live navigation
  const startLiveNavigation = () => {
    if (!end) {
      alert('Please select a destination first!')
      return
    }
    setIsLiveNavigating(true)
    onLiveTrackingChange?.(true)
  }

  // Stop live navigation
  const stopLiveNavigation = () => {
    setIsLiveNavigating(false)
    onLiveTrackingChange?.(false)
  }

  // Use current location as start
  const useMyLocation = () => {
    if (userLocation) {
      onStartChange({ lat: userLocation.lat, lng: userLocation.lng })
      setStartInput('📍 My Location')
      setShowStartSuggestions(false)
      onPickModeChange?.(null)
    } else {
      alert('Please enable location access first!')
    }
  }

  // Search for start location
  const handleStartInputChange = async (value) => {
    setStartInput(value)
    setShowStartSuggestions(true)
    
    // Check if it's coordinates
    const coords = parseCoordinates(value)
    if (coords) {
      onStartChange(coords)
      setStartSuggestions([])
      return
    }
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce search
    if (value.length >= 3) {
      setIsSearchingStart(true)
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchLocation(value)
        setStartSuggestions(results)
        setIsSearchingStart(false)
      }, 500)
    } else {
      setStartSuggestions([])
    }
  }

  // Search for end location
  const handleEndInputChange = async (value) => {
    setEndInput(value)
    setShowEndSuggestions(true)
    
    // Check if it's coordinates
    const coords = parseCoordinates(value)
    if (coords) {
      onEndChange(coords)
      setEndSuggestions([])
      return
    }
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce search
    if (value.length >= 3) {
      setIsSearchingEnd(true)
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchLocation(value)
        setEndSuggestions(results)
        setIsSearchingEnd(false)
      }, 500)
    } else {
      setEndSuggestions([])
    }
  }

  // Select start suggestion
  const selectStartSuggestion = (suggestion) => {
    setStartInput(suggestion.shortName)
    onStartChange({ lat: suggestion.lat, lng: suggestion.lng })
    setStartSuggestions([])
    setShowStartSuggestions(false)
  }

  // Select end suggestion
  const selectEndSuggestion = (suggestion) => {
    setEndInput(suggestion.shortName)
    onEndChange({ lat: suggestion.lat, lng: suggestion.lng })
    setEndSuggestions([])
    setShowEndSuggestions(false)
  }

  // Parse coordinates from input (format: "lat, lng" or "lat,lng")
  const parseCoordinates = (input) => {
    const parts = input.split(',').map(s => parseFloat(s.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] }
    }
    return null
  }

  // Swap start and end
  const swapLocations = () => {
    const tempInput = startInput
    setStartInput(endInput)
    setEndInput(tempInput)
    
    const tempCoord = start
    onStartChange(end)
    onEndChange(tempCoord)
  }

  // Start navigation
  const startNavigation = () => {
    if (start && end) {
      setIsNavigating(true)
    } else {
      alert('Please enter both start and destination!')
    }
  }

  // Clear navigation
  const clearNavigation = () => {
    setIsNavigating(false)
    setIsLiveNavigating(false)
    onLiveTrackingChange?.(false)
    onStartChange(null)
    onEndChange(null)
    setStartInput('')
    setEndInput('')
  }

  // Format distance
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes} min`
  }

  // Format speed
  const formatSpeed = (mps) => {
    const kmh = (mps || 0) * 3.6
    return `${kmh.toFixed(0)} km/h`
  }

  // Get active hazards (High severity alerts)
  const activeHazards = alerts?.filter(a => !a.expired && (a.severity === 'High' || a.severity === 'Medium')) || []

  return (
    <div className={`bg-white overflow-hidden ${isMobile ? 'rounded-none' : 'rounded-2xl shadow-2xl border border-gray-100 w-80'}`}>
      {/* Header - Compact for mobile */}
      <div className={`bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-between ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}>
        <div className="flex items-center gap-2 text-white">
          <DirectionsIcon style={{ fontSize: isMobile ? 18 : 24 }} />
          <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>Route Navigation</span>
        </div>
      </div>

      {/* Input Section */}
      <div className={`space-y-2 ${isMobile ? 'p-3' : 'p-4 space-y-3'}`}>
        {/* Pick on Map Mode Indicator - Hidden on mobile since parent shows it */}
        {pickingMode && !isMobile && (
          <div className={`p-2 rounded-lg text-center text-sm font-medium animate-pulse ${
            pickingMode === 'start' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            👆 Click on map to set {pickingMode === 'start' ? 'START' : 'DESTINATION'}
          </div>
        )}

        {/* Start Point */}
        <div className="relative">
          <div className={`absolute left-3 w-3 h-3 rounded-full border-2 border-white shadow z-10 ${
            pickingMode === 'start' ? 'bg-green-500 animate-pulse' : 'bg-green-500'
          } ${isMobile ? 'top-2.5' : 'top-3'}`}></div>
          <input
            type="text"
            placeholder={isMobile ? "Start point..." : "Search or pick on map..."}
            value={startInput}
            onChange={(e) => handleStartInputChange(e.target.value)}
            onFocus={() => setShowStartSuggestions(true)}
            onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
            className={`w-full pl-9 pr-20 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none ${
              isMobile ? 'py-2 text-xs' : 'py-2.5 text-sm'
            } ${pickingMode === 'start' ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={togglePickStart}
              className={`p-1 rounded-full transition-colors ${
                pickingMode === 'start' 
                  ? 'bg-green-500 text-white' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Pick on map"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </button>
            <button
              onClick={useMyLocation}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Use my location"
            >
              <MyLocationIcon style={{ fontSize: isMobile ? 16 : 18 }} />
            </button>
          </div>
          
          {/* Start Suggestions Dropdown */}
          {showStartSuggestions && (startSuggestions.length > 0 || isSearchingStart) && (
            <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-y-auto ${isMobile ? 'max-h-32' : 'max-h-48'}`}>
              {isSearchingStart ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                  Searching...
                </div>
              ) : (
                startSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectStartSuggestion(suggestion)}
                    className={`w-full text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'}`}
                  >
                    <div className={`font-medium text-gray-800 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>{suggestion.shortName}</div>
                    <div className="text-xs text-gray-500 truncate">{suggestion.name}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Swap Button - More compact on mobile */}
        <div className={`flex justify-center ${isMobile ? 'py-0' : ''}`}>
          <button
            onClick={swapLocations}
            className={`text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all ${isMobile ? 'p-1' : 'p-1.5'}`}
            title="Swap locations"
          >
            <SwapVertIcon style={{ fontSize: isMobile ? 18 : 20 }} />
          </button>
        </div>

        {/* End Point */}
        <div className="relative">
          <div className={`absolute left-3 w-3 h-3 rounded-full border-2 border-white shadow z-10 ${
            pickingMode === 'end' ? 'bg-red-500 animate-pulse' : 'bg-red-500'
          } ${isMobile ? 'top-2.5' : 'top-3'}`}></div>
          <input
            type="text"
            placeholder={isMobile ? "Destination..." : "Search or pick on map..."}
            value={endInput}
            onChange={(e) => handleEndInputChange(e.target.value)}
            onFocus={() => setShowEndSuggestions(true)}
            onBlur={() => setTimeout(() => setShowEndSuggestions(false), 200)}
            className={`w-full pl-9 pr-10 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none ${
              isMobile ? 'py-2 text-xs' : 'py-2.5 text-sm'
            } ${pickingMode === 'end' ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
          />
          <button
            onClick={togglePickEnd}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
              pickingMode === 'end' 
                ? 'bg-red-500 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Pick on map"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </button>
          
          {/* End Suggestions Dropdown */}
          {showEndSuggestions && (endSuggestions.length > 0 || isSearchingEnd) && (
            <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-y-auto ${isMobile ? 'max-h-32' : 'max-h-48'}`}>
              {isSearchingEnd ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                  Searching...
                </div>
              ) : (
                endSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectEndSuggestion(suggestion)}
                    className={`w-full text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'}`}
                  >
                    <div className={`font-medium text-gray-800 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>{suggestion.shortName}</div>
                    <div className="text-xs text-gray-500 truncate">{suggestion.name}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {/* Action Buttons - Compact on mobile */}
        <div className="flex gap-2">
          {!isNavigating ? (
            <button
              onClick={startNavigation}
              disabled={!start || !end}
              className={`flex-1 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                isMobile ? 'py-2 text-sm' : 'py-2.5'
              } ${start && end
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <DirectionsIcon style={{ fontSize: isMobile ? 16 : 18 }} />
              Get Route
            </button>
          ) : (
            <>
              {!isLiveNavigating ? (
                <button
                  onClick={startLiveNavigation}
                  className={`flex-1 rounded-lg font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transition-all ${isMobile ? 'py-2 text-sm' : 'py-2.5'}`}
                >
                  <PlayArrowIcon style={{ fontSize: isMobile ? 16 : 18 }} />
                  Start
                </button>
              ) : (
                <button
                  onClick={stopLiveNavigation}
                  className={`flex-1 rounded-lg font-semibold flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 transition-all animate-pulse ${isMobile ? 'py-2 text-sm' : 'py-2.5'}`}
                >
                  <StopIcon style={{ fontSize: isMobile ? 16 : 18 }} />
                  Stop
                </button>
              )}
              <button
                onClick={clearNavigation}
                className={`rounded-lg font-semibold flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 transition-all ${isMobile ? 'px-3 py-2' : 'px-4 py-2.5'}`}
              >
                <CancelIcon style={{ fontSize: isMobile ? 16 : 18 }} />
              </button>
            </>
          )}
        </div>

        {/* Live Navigation Status - Compact on mobile */}
        {isLiveNavigating && (
          <div className={`bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white ${isMobile ? 'p-3' : 'p-4'}`}>
            <div className={`flex items-center gap-2 ${isMobile ? 'mb-2' : 'mb-3'}`}>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className={`font-bold ${isMobile ? 'text-sm' : ''}`}>Live Navigation Active</span>
            </div>
            
            {liveTrackingData && (
              <div className={`grid grid-cols-2 ${isMobile ? 'gap-2' : 'gap-3'}`}>
                <div className={`bg-white/20 rounded-lg ${isMobile ? 'p-1.5' : 'p-2'}`}>
                  <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
                    <SpeedIcon style={{ fontSize: isMobile ? 12 : 14 }} />
                    Speed
                  </div>
                  <div className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>{formatSpeed(liveTrackingData.speed)}</div>
                </div>
                
                <div className={`bg-white/20 rounded-lg ${isMobile ? 'p-1.5' : 'p-2'}`}>
                  <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
                    <StraightenIcon style={{ fontSize: isMobile ? 12 : 14 }} />
                    Remaining
                  </div>
                  <div className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {liveTrackingData.distanceToDestination 
                      ? formatDistance(liveTrackingData.distanceToDestination)
                      : '--'}
                  </div>
                </div>
                
                {/* Hide accuracy on mobile to save space */}
                {!isMobile && (
                  <div className="col-span-2 bg-white/20 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
                      <GpsFixedIcon style={{ fontSize: 14 }} />
                      Accuracy
                    </div>
                    <div className="font-medium">±{Math.round(liveTrackingData.accuracy || 0)}m</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Arrival Check */}
            {liveTrackingData?.distanceToDestination && liveTrackingData.distanceToDestination < 50 && (
              <div className={`bg-green-400 text-green-900 rounded-lg text-center font-bold animate-bounce ${isMobile ? 'mt-2 p-1.5 text-sm' : 'mt-3 p-2'}`}>
                🎉 You have arrived!
              </div>
            )}
          </div>
        )}

        {/* Route Info Display */}
        {routeInfo && (
          <div className={`rounded-xl border ${isMobile ? 'p-3' : 'p-4'} ${
            routeInfo.isFallback 
              ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300' 
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
          }`}>
            {/* Fallback Warning - NOT a real road route */}
            {routeInfo.isFallback && (
              <div className={`bg-red-100 border-2 border-red-400 rounded-lg mb-3 ${isMobile ? 'p-2' : 'p-3'}`}>
                <div className={`flex items-center gap-2 text-red-700 font-bold mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <WarningIcon style={{ fontSize: isMobile ? 16 : 20 }} />
                  ⚠️ Routing Service Unavailable
                </div>
                <div className={`text-red-600 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  {routeInfo.fallbackMessage || 'Unable to calculate road route. The line shown is a straight line, NOT an actual road path.'}
                </div>
                <div className="text-xs text-red-500 mt-2 font-medium">
                  Please check your internet connection and try again.
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <StraightenIcon className={routeInfo.isFallback ? "text-red-600" : "text-green-600"} style={{ fontSize: 18 }} />
                <span className={`font-bold ${routeInfo.isFallback ? "text-red-800" : "text-green-800"}`}>
                  {formatDistance(routeInfo.distance)}
                  {routeInfo.isFallback && <span className="text-xs font-normal ml-1">(straight line)</span>}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <AccessTimeIcon className={routeInfo.isFallback ? "text-red-600" : "text-green-600"} style={{ fontSize: 18 }} />
                <span className={`font-bold ${routeInfo.isFallback ? "text-red-800" : "text-green-800"}`}>
                  {formatTime(routeInfo.time)}
                  {routeInfo.isFallback && <span className="text-xs font-normal ml-1">(estimated)</span>}
                </span>
              </div>
            </div>

            {/* Route Selection Info - Only show for real routes */}
            {!routeInfo.isFallback && routeInfo.alternativeRoutes > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-blue-700">
                    <span className="font-semibold">🛡️ Smart Route Selection:</span> Analyzed {routeInfo.alternativeRoutes} road routes
                  </div>
                  <button 
                    onClick={() => setShowAllRoutes(!showAllRoutes)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    {showAllRoutes ? 'Hide Routes' : 'View All Routes'}
                  </button>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  🎨 Route colors: <span className="text-green-600 font-medium">Green=Safe</span> • <span className="text-orange-600 font-medium">Orange=Medium</span> • <span className="text-red-600 font-medium">Red=High Risk</span>
                </div>
                <div className="text-xs text-purple-600 mt-0.5">
                  Click on any route line to switch to it
                </div>
              </div>
            )}

            {/* All Routes List - Show when user clicks "View All Routes" */}
            {!routeInfo.isFallback && routeInfo.allRoutes && routeInfo.allRoutes.length > 1 && showAllRoutes && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                <div className="text-xs font-semibold text-gray-700 mb-2">All Available Road Routes:</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {routeInfo.allRoutes.map((route, idx) => (
                    <button
                      key={idx}
                      onClick={() => onRouteSelect?.(idx)}
                      className={`w-full text-left p-2.5 rounded-lg border-2 transition-all ${
                        route.isSelected 
                          ? route.maxSeverity === 'High' ? 'border-red-500 bg-red-50 shadow-sm'
                            : route.maxSeverity === 'Medium' ? 'border-orange-500 bg-orange-50 shadow-sm'
                            : route.hazardScore === 0 ? 'border-green-500 bg-green-50 shadow-sm'
                            : 'border-lime-500 bg-lime-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${
                            route.hazardScore === 0 ? 'bg-green-500' : 
                            route.maxSeverity === 'Low' ? 'bg-lime-500' :
                            route.maxSeverity === 'Medium' ? 'bg-orange-500' : 'bg-red-500'
                          }`}></span>
                          <span className="text-sm font-medium text-gray-800">
                            Route {idx + 1}
                            {route.isSafest && <span className="ml-1 text-emerald-600 text-xs">(Safest)</span>}
                            {route.isSelected && <span className="ml-1 text-blue-600 text-xs">(Current)</span>}
                          </span>
                        </div>
                        <div className={`text-xs font-medium ${
                          route.hazardScore === 0 ? 'text-green-600' : 
                          route.maxSeverity === 'Low' ? 'text-lime-600' :
                          route.maxSeverity === 'Medium' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {route.hazardScore === 0 ? '✅ Safe' : 
                           route.maxSeverity === 'High' ? `🔴 ${route.hazardsOnRoute?.length || 0} High Risk` :
                           route.maxSeverity === 'Medium' ? `🟠 ${route.hazardsOnRoute?.length || 0} Medium Risk` :
                           `🟡 ${route.hazardsOnRoute?.length || 0} Low Risk`}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-3">
                        <span>{formatDistance(route.distance)}</span>
                        <span>{formatTime(route.time)}</span>
                      </div>
                      {!route.isSelected && (
                        <div className="text-xs text-purple-600 mt-1 font-medium">
                          Click to switch to this route →
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Safer Alternative Routes Available - Only for real routes */}
            {!routeInfo.isFallback && routeInfo.saferAlternatives && routeInfo.saferAlternatives.length > 0 && routeInfo.hazardsOnRoute?.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-300 rounded-lg p-3 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    🛡️ Safer Routes Available!
                  </div>
                </div>
                
                {/* Best Alternative Preview */}
                {routeInfo.saferAlternatives.slice(0, 2).map((alt, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2.5 mb-2 border border-emerald-200 hover:border-emerald-400 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            {alt.hazardScore === 0 ? '✅ HAZARD-FREE' : `${alt.hazardsAvoided?.length || 0} fewer hazards`}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {formatDistance(alt.distance)} • {formatTime(alt.time)}
                          {alt.extraTime > 0 && (
                            <span className="text-amber-600 ml-1">
                              (+{formatTime(alt.extraTime)} longer)
                            </span>
                          )}
                        </div>
                        {alt.hazardsAvoided && alt.hazardsAvoided.length > 0 && (
                          <div className="text-xs text-emerald-600 mt-1">
                            Avoids: {alt.hazardsAvoided.map(h => h.type).join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onRouteSelect?.(alt.index)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Use This
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <span>💡</span>
                  <span>Click on dashed lines on map or buttons above to switch routes</span>
                </div>
              </div>
            )}

            {/* Hazard Warning - Only for real routes */}
            {!routeInfo.isFallback && routeInfo.hazardsOnRoute && routeInfo.hazardsOnRoute.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
                  <WarningIcon style={{ fontSize: 18 }} />
                  {routeInfo.hazardsOnRoute.length} Hazard{routeInfo.hazardsOnRoute.length > 1 ? 's' : ''} on Route
                  {routeInfo.unavoidableHazards?.length > 0 && (
                    <span className="text-xs font-normal bg-red-100 px-1.5 py-0.5 rounded">
                      {routeInfo.unavoidableHazards.length} unavoidable
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {routeInfo.hazardsOnRoute.slice(0, 3).map((hazard, idx) => (
                    <div key={hazard.id || idx} className="text-xs text-red-600 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${hazard.severity === 'High' ? 'bg-red-500' : hazard.severity === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
                      {hazard.type} ({hazard.severity})
                      {hazard.distanceFromRoute && <span className="text-gray-500">• {Math.round(hazard.distanceFromRoute)}m away</span>}
                      {routeInfo.saferAlternatives?.length > 0 && routeInfo.avoidableHazards?.some(ah => ah.id === hazard.id) && (
                        <span className="text-emerald-600 font-medium">(can avoid)</span>
                      )}
                      {routeInfo.unavoidableHazards?.some(uh => uh.id === hazard.id) && (
                        <span className="text-red-700 font-medium">(unavoidable)</span>
                      )}
                    </div>
                  ))}
                  {routeInfo.hazardsOnRoute.length > 3 && (
                    <div className="text-xs text-red-500">+{routeInfo.hazardsOnRoute.length - 3} more</div>
                  )}
                </div>
                {routeInfo.saferAlternatives?.length > 0 && (
                  <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 rounded p-1.5 flex items-center gap-1">
                    <span>💡</span>
                    <span>Safer alternative routes shown above!</span>
                  </div>
                )}
                {(!routeInfo.saferAlternatives || routeInfo.saferAlternatives.length === 0) && routeInfo.alternativeRoutes > 1 && (
                  <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded p-1.5">
                    💡 Click "View All Routes" above to see and compare all {routeInfo.alternativeRoutes} available routes
                  </div>
                )}
                {(!routeInfo.alternativeRoutes || routeInfo.alternativeRoutes <= 1) && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded p-1.5">
                    ⚠️ Drive carefully - only one route available in this area. No detours possible.
                  </div>
                )}
              </div>
            )}

            {/* Clear route message - Only for real routes */}
            {!routeInfo.isFallback && (!routeInfo.hazardsOnRoute || routeInfo.hazardsOnRoute.length === 0) && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">
                <span className="text-green-700 text-sm font-medium">✓ Clear road route - No hazards detected!</span>
              </div>
            )}
          </div>
        )}

        {/* Active Hazards Warning */}
        {activeHazards.length > 0 && !routeInfo && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <WarningIcon style={{ fontSize: 16 }} />
              <span className="font-medium">{activeHazards.length} active hazard{activeHazards.length > 1 ? 's' : ''} nearby</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">Route will show hazards along the way</p>
          </div>
        )}

        {/* Instructions Hint */}
        {!isLiveNavigating && (
          <div className="text-xs text-gray-500 text-center">
            🔍 Search by place name (e.g., "Dhaka University")<br />
            📍 Or enter coordinates: 23.8103, 90.4125
          </div>
        )}
      </div>
    </div>
  )
}

// Export the routing machine component, live tracker, and map click handler
export { RoutingMachine, LiveLocationTracker, MapClickHandler }


import { useEffect, useState, useRef } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import WarningIcon from '@mui/icons-material/Warning'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import DeleteIcon from '@mui/icons-material/Delete'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import EditLocationIcon from '@mui/icons-material/EditLocation'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import GoogleIcon from '@mui/icons-material/Google'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloseIcon from '@mui/icons-material/Close'
import CollectionsIcon from '@mui/icons-material/Collections'
import HomeIcon from '@mui/icons-material/Home'
import DescriptionIcon from '@mui/icons-material/Description'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'

const HAZARD_TYPES = [
  { value: 'Potholes', icon: '🕳️', color: 'from-gray-500 to-gray-600' },
  { value: 'Accident', icon: '🚨', color: 'from-red-500 to-red-600' },
  { value: 'Floods', icon: '🌊', color: 'from-blue-500 to-blue-600' },
  { value: 'Broken Roads', icon: '🚧', color: 'from-orange-500 to-orange-600' },
  { value: 'Landslides', icon: '⛰️', color: 'from-yellow-700 to-yellow-800' },
  { value: 'Road Closures', icon: '🚫', color: 'from-red-600 to-red-700' },
  { value: 'Police Checkpoints', icon: '👮', color: 'from-blue-600 to-blue-700' },
  { value: 'Heavy Traffic Jam', icon: '🚗', color: 'from-purple-500 to-purple-600' },
  { value: 'Fire on Roadside', icon: '🔥', color: 'from-orange-600 to-red-600' },
  { value: 'Animal Crossing', icon: '🦌', color: 'from-green-600 to-green-700' }
]
const SEVERITIES = [
  { value: 'Low', color: 'from-green-500 to-green-600', icon: '🟢', description: 'Minor inconvenience' },
  { value: 'Medium', color: 'from-orange-500 to-orange-600', icon: '🟠', description: 'Caution required' },
  { value: 'High', color: 'from-red-500 to-red-600', icon: '🔴', description: 'Dangerous hazard' }
]

// Component to handle map click for location selection
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng)
    },
  })

  return position ? <Marker position={position} /> : null
}

// Section Card Component
function SectionCard({ title, icon: Icon, children, className = '', gradient = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden ${className}`}>
      {title && (
        <div className={`px-5 py-4 border-b border-slate-100 ${gradient || 'bg-gradient-to-r from-slate-50 to-white'}`}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Icon className="text-white" style={{ fontSize: 18 }} />
              </div>
            )}
            <h3 className="font-bold text-slate-800">{title}</h3>
          </div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

// Step Indicator for Mobile
function StepIndicator({ currentStep, totalSteps, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            idx < currentStep 
              ? 'bg-emerald-500 text-white' 
              : idx === currentStep 
                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' 
                : 'bg-slate-200 text-slate-500'
          }`}>
            {idx < currentStep ? '✓' : idx + 1}
          </div>
          {idx < totalSteps - 1 && (
            <div className={`w-8 h-1 mx-1 rounded-full transition-all duration-300 ${
              idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ReportAlert() {
  const navigate = useNavigate()
  const { addAlert } = useAlerts()
  const { user, isAuthenticated, signInWithGoogle } = useAuth()
  const { showToast } = useNotifications()
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [currentStep, setCurrentStep] = useState(0)
  
  const [form, setForm] = useState({
    type: '',
    severity: '',
    description: '',
    photos: [],
    lat: null,
    lng: null,
    voiceNote: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [isVoiceSupported, setIsVoiceSupported] = useState(true)
  const [voiceWaveform, setVoiceWaveform] = useState([])
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [micError, setMicError] = useState(null)
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  
  const steps = [
    { label: 'Type', icon: WarningIcon },
    { label: 'Details', icon: DescriptionIcon },
    { label: 'Location', icon: LocationOnIcon },
    { label: 'Submit', icon: SendIcon }
  ]
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Get available audio devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Need to request permission first to get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => stream.getTracks().forEach(track => track.stop()))
        
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(d => d.kind === 'audioinput')
        console.log('Available microphones:', audioInputs)
        setAudioDevices(audioInputs)
        
        // Select default device
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId)
        }
      } catch (err) {
        console.error('Error getting devices:', err)
      }
    }
    getDevices()
  }, [])
  
// Check for Speech Recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsVoiceSupported(true)
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setVoiceTranscript(prev => prev + finalTranscript)
          setForm(f => ({ ...f, description: f.description + finalTranscript }))
        }
      }
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }
      
      recognitionRef.current.onend = () => {
        // Don't set isRecording to false here, let toggleVoiceRecording handle it
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [])
  
  // Simulate voice waveform animation
  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => {
        setVoiceWaveform(Array.from({ length: 12 }, () => Math.random() * 100))
      }, 100)
    } else {
      setVoiceWaveform([])
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const toggleVoiceRecording = async () => {
    setMicError(null)
    
    if (isRecording) {
      // === STOP RECORDING ===
      console.log('Stopping recording...')
      
      // Stop speech recognition
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }
      
      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      
      setIsRecording(false)
      
    } else {
      // === START RECORDING ===
      console.log('Starting recording...')
      
      // Reset states
      setVoiceTranscript('')
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingDuration(0)
      audioChunksRef.current = []
      
      try {
        // Get microphone stream with selected device
        console.log('Requesting microphone access for device:', selectedDeviceId)
        const constraints = {
          audio: {
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000
          }
        }
        console.log('Audio constraints:', constraints)
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        
        streamRef.current = stream
        
        const audioTracks = stream.getAudioTracks()
        console.log('Got audio tracks:', audioTracks.length)
        
        if (audioTracks.length === 0) {
          setMicError('No microphone found')
          return
        }
        
        // Log track settings
        const settings = audioTracks[0].getSettings()
        console.log('Track settings:', settings)
        
        // Create audio context to visualize and verify audio input
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const source = audioContext.createMediaStreamSource(stream)
        analyserRef.current = audioContext.createAnalyser()
        analyserRef.current.fftSize = 256
        source.connect(analyserRef.current)
        
        // Create MediaRecorder
        const options = {}
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options.mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options.mimeType = 'audio/webm'
        }
        
        console.log('Creating MediaRecorder with options:', options)
        const recorder = new MediaRecorder(stream, options)
        mediaRecorderRef.current = recorder
        
        recorder.ondataavailable = (e) => {
          console.log('Chunk received:', e.data.size, 'bytes')
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }
        
        recorder.onstop = () => {
          console.log('MediaRecorder stopped. Total chunks:', audioChunksRef.current.length)
          
          if (audioChunksRef.current.length === 0) {
            setMicError('No audio data recorded')
            return
          }
          
          const totalSize = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0)
          console.log('Total audio size:', totalSize, 'bytes')
          
          const mimeType = recorder.mimeType || 'audio/webm'
          const blob = new Blob(audioChunksRef.current, { type: mimeType })
          console.log('Final blob:', blob.size, 'bytes, type:', blob.type)
          
          const url = URL.createObjectURL(blob)
          setAudioBlob(blob)
          setAudioUrl(url)
          setForm(f => ({ ...f, voiceNote: blob }))
          
          // Stop stream tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
          
          // Close audio context
          if (audioContext) {
            audioContext.close()
          }
        }
        
        recorder.onerror = (e) => {
          console.error('MediaRecorder error:', e)
          setMicError('Recording error: ' + e.error?.message || 'Unknown error')
        }
        
        // Start recording with 500ms timeslice
        recorder.start(500)
        console.log('MediaRecorder started, state:', recorder.state)
        
        // Start real waveform visualization
        const updateWaveform = () => {
          if (analyserRef.current && isRecording) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
            analyserRef.current.getByteFrequencyData(dataArray)
            const waveform = Array.from(dataArray.slice(0, 12)).map(v => (v / 255) * 100)
            setVoiceWaveform(waveform)
          }
        }
        
        // Update waveform every 100ms
        const waveformInterval = setInterval(updateWaveform, 100)
        
        // Start speech recognition
        if (recognitionRef.current) {
          try { recognitionRef.current.start() } catch (e) { console.log('Speech recognition:', e) }
        }
        
        // Start duration timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1)
        }, 1000)
        
        // Store waveform interval to clear later
        const originalStop = recorder.onstop
        recorder.onstop = (e) => {
          clearInterval(waveformInterval)
          setVoiceWaveform([])
          originalStop(e)
        }
        
        setIsRecording(true)
        
      } catch (error) {
        console.error('Microphone access error:', error)
        if (error.name === 'NotAllowedError') {
          setMicError('Microphone access denied. Please allow microphone permission.')
        } else if (error.name === 'NotFoundError') {
          setMicError('No microphone found. Please connect a microphone.')
        } else {
          setMicError('Error: ' + error.message)
        }
      }
    }
  }
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const togglePlayback = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          audioRef.current.volume = 1.0
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (error) {
        console.error('Playback error:', error)
      }
    }
  }
  
  const removeVoiceRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setVoiceTranscript('')
    setRecordingDuration(0)
    setForm(f => ({ ...f, voiceNote: null }))
  }

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('Location detected:', pos.coords.latitude, pos.coords.longitude)
          setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        },
        (error) => {
          console.error('Location error:', error.message)
          // Try again with lower accuracy
          navigator.geolocation.getCurrentPosition(
            (pos) => setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude })),
            (err) => console.error('Location retry failed:', err.message),
            { enableHighAccuracy: false, timeout: 15000 }
          )
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }, [])

  const onPhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Add new photos to existing photos (max 10 photos)
    setForm(f => {
      const newPhotos = [...f.photos, ...files].slice(0, 10)
      return { ...f, photos: newPhotos }
    })
    
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const removePhoto = (index) => {
    setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }))
  }
  
  const movePhoto = (index, direction) => {
    setForm(f => {
      const newPhotos = [...f.photos]
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= newPhotos.length) return f
      ;[newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]]
      return { ...f, photos: newPhotos }
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      showToast('Please sign in to report hazards', 'warning', 5000)
      return
    }
    
    setIsSubmitting(true)
    setTimeout(() => {
      addAlert({
        type: form.type,
        severity: form.severity,
        description: form.description,
        photos: form.photos,
        lat: form.lat,
        lng: form.lng,
        contributor: user?.displayName || 'Anonymous',
        contributorId: user?.uid,
        contributorEmail: user?.email,
        alternateRoutes: form.alternateRoutes,
        voiceNote: form.voiceNote
      })
      
      // Show success notification
      showToast(`${form.type} hazard reported successfully!`, 'success', 5000)
      
      setIsSubmitting(false)
      navigate('/')
    }, 800)
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: return form.type && form.severity
      case 1: return true // Description is optional
      case 2: return form.lat && form.lng
      case 3: return form.type && form.severity && form.lat && form.lng
      default: return false
    }
  }
  
  const nextStep = () => {
    if (canProceed() && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // ============ RENDER SECTIONS ============
  
  // Hazard Type & Severity Section
  const HazardTypeSection = () => (
    <div className="space-y-6">
      {/* Hazard Type */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">Select Hazard Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
          {HAZARD_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: t.value }))}
              className={`p-3 lg:p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                form.type === t.value
                  ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-lg`
                  : 'border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50/50'
              }`}
            >
              <div className="text-2xl lg:text-3xl mb-1 lg:mb-2">{t.icon}</div>
              <div className={`text-[10px] lg:text-xs font-semibold leading-tight ${
                form.type === t.value ? 'text-white' : 'text-slate-700'
              }`}>
                {t.value}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">Severity Level</label>
        <div className="grid grid-cols-3 gap-3">
          {SEVERITIES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, severity: s.value }))}
              className={`p-4 lg:p-5 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                form.severity === s.value
                  ? `bg-gradient-to-br ${s.color} text-white border-transparent shadow-lg`
                  : 'border-slate-200 hover:border-orange-300 bg-white'
              }`}
            >
              <div className="text-3xl lg:text-4xl mb-1">{s.icon}</div>
              <div className={`text-sm lg:text-base font-bold ${
                form.severity === s.value ? 'text-white' : 'text-slate-700'
              }`}>
                {s.value}
              </div>
              <div className={`text-[10px] lg:text-xs mt-0.5 ${
                form.severity === s.value ? 'text-white/80' : 'text-slate-500'
              }`}>
                {s.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
  
  // Description & Voice Section
  const DescriptionSection = () => (
    <div className="space-y-5">
      {/* Text Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Description (Optional)</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all outline-none resize-none text-sm lg:text-base"
          rows={4}
          placeholder="Describe the hazard in detail..."
        />
      </div>

      {/* Voice Recording */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
        <div className="flex items-center gap-2 mb-3">
          <MicIcon className="text-purple-600" style={{ fontSize: 20 }} />
          <span className="font-semibold text-slate-700 text-sm">Voice Recording</span>
          <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">NEW</span>
        </div>
        
        {/* Microphone Selector */}
        <div className="mb-3">
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isRecording}
            className="w-full border-2 border-purple-200 rounded-lg p-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none bg-white disabled:bg-slate-100"
          >
            {audioDevices.length === 0 ? (
              <option value="">No microphones found</option>
            ) : (
              audioDevices.map((device, idx) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>
        
        {micError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            ⚠️ {micError}
          </div>
        )}
        
        {/* Recording Controls */}
        {!audioUrl ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-200'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-200'
              }`}
            >
              {isRecording ? (
                <MicOffIcon className="text-white" style={{ fontSize: 24 }} />
              ) : (
                <MicIcon className="text-white" style={{ fontSize: 24 }} />
              )}
              {isRecording && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            
            <div className="flex-1">
              {isRecording ? (
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="flex items-center gap-1 h-8">
                    {voiceWaveform.map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-red-500 to-orange-500 rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(8, height)}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-red-500 text-xs font-medium flex items-center gap-1">
                      <GraphicEqIcon style={{ fontSize: 14 }} className="animate-pulse" />
                      Recording...
                    </span>
                    <span className="text-red-600 font-mono text-xs font-bold">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs">
                  Tap to start voice recording
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <AudiotrackIcon className="text-white" style={{ fontSize: 20 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">Voice Recording</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <CheckCircleIcon style={{ fontSize: 10 }} />
                    Saved
                  </span>
                </div>
                <span className="text-xs text-slate-500">{formatDuration(recordingDuration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white"
                >
                  {isPlaying ? <PauseIcon style={{ fontSize: 18 }} /> : <PlayArrowIcon style={{ fontSize: 18 }} />}
                </button>
                <button
                  type="button"
                  onClick={removeVoiceRecording}
                  className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600"
                >
                  <DeleteIcon style={{ fontSize: 18 }} />
                </button>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        )}
        
        {voiceTranscript && (
          <div className="mt-3 p-2 bg-white rounded-lg border border-purple-200">
            <div className="text-[10px] font-semibold text-purple-700 mb-1">Transcript:</div>
            <p className="text-slate-700 text-xs italic">"{voiceTranscript.trim()}"</p>
          </div>
        )}
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">Photos (Optional)</label>
          {form.photos.length > 0 && (
            <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {form.photos.length}/10
            </span>
          )}
        </div>
        
        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
          form.photos.length >= 10 
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed' 
            : 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/50 cursor-pointer'
        }`}>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onPhotoChange}
            className="hidden"
            id="photo-upload"
            disabled={form.photos.length >= 10}
          />
          <label htmlFor="photo-upload" className={`block ${form.photos.length >= 10 ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <AddPhotoAlternateIcon 
              className={form.photos.length >= 10 ? 'text-slate-300' : 'text-orange-400'} 
              style={{ fontSize: 36 }} 
            />
            <p className={`text-xs font-medium mt-1 ${form.photos.length >= 10 ? 'text-slate-400' : 'text-slate-600'}`}>
              {form.photos.length >= 10 ? 'Max photos reached' : 'Tap to upload'}
            </p>
          </label>
        </div>
        
        {form.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
            {form.photos.map((file, idx) => {
              const url = URL.createObjectURL(file)
              return (
                <div key={`${file.name}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={url} alt={file.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CloseIcon style={{ fontSize: 12 }} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-0.5 text-center truncate">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
  
  // Location Section
  const LocationSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Hazard Location</label>
          <p className="text-xs text-slate-500 mt-0.5">
            {form.lat && form.lng 
              ? `📍 ${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}`
              : 'Detecting your location...'
            }
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude })),
                (err) => alert('Could not get location: ' + err.message),
                { enableHighAccuracy: true, timeout: 10000 }
              )
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          <MyLocationIcon style={{ fontSize: 16 }} />
          <span className="hidden sm:inline">Locate Me</span>
        </button>
      </div>
      
      <div className="rounded-xl overflow-hidden border-2 border-blue-200 shadow-inner" style={{ height: isMobile ? '250px' : '300px' }}>
        <MapContainer
          center={[form.lat || 23.8103, form.lng || 90.4125]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          key={`${form.lat}-${form.lng}`}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker 
            position={form.lat && form.lng ? [form.lat, form.lng] : null} 
            setPosition={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} 
          />
        </MapContainer>
      </div>
      <p className="text-[11px] text-blue-600 text-center">📍 Tap on map to set exact location</p>
    </div>
  )
  
  // Submit Section
  const SubmitSection = () => (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Report Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-600">Hazard Type</span>
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              {HAZARD_TYPES.find(t => t.value === form.type)?.icon} {form.type || '-'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-600">Severity</span>
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              {SEVERITIES.find(s => s.value === form.severity)?.icon} {form.severity || '-'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-600">Location</span>
            <span className="font-medium text-slate-800 text-xs">
              {form.lat && form.lng ? `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}` : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-600">Photos</span>
            <span className="font-semibold text-slate-800">{form.photos.length} attached</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600">Voice Note</span>
            <span className="font-semibold text-slate-800">{audioUrl ? '✓ Attached' : 'None'}</span>
          </div>
        </div>
      </div>
      
      {/* Description Preview */}
      {form.description && (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-2 text-sm">Description</h4>
          <p className="text-slate-600 text-sm">{form.description}</p>
        </div>
      )}
    </div>
  )

  // ============ MAIN RENDER ============

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100">
      {/* ============ DESKTOP LAYOUT - True Full Viewport ============ */}
      {!isMobile && (
        <>
          {/* Integrated Navbar */}
          <header className="flex-shrink-0 h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">Road<span className="text-emerald-600">Guard</span></span>
            </NavLink>
            
            {/* Nav Links */}
            <div className="flex items-center gap-2">
              <NavLink to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
                <HomeIcon style={{ fontSize: 18 }} />
                <span>Map</span>
              </NavLink>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-orange-500 text-white">
                <WarningIcon style={{ fontSize: 18 }} />
                <span>Report</span>
              </div>
              <NavLink to="/emergency" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all">
                <span>SOS</span>
              </NavLink>
            </div>
          </header>
          
          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT SIDE - Form Panel */}
            <div className="w-[50%] xl:w-[45%] h-full flex flex-col bg-white border-r border-slate-200">
              {/* Form Header */}
              <div className="flex-shrink-0 px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <WarningIcon className="text-white" style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-slate-800">Report Hazard</h1>
                    <p className="text-[11px] text-slate-500">Help keep roads safe for everyone</p>
                  </div>
                </div>
              </div>
              
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={onSubmit} className="p-5 space-y-5">
                  {/* Hazard Type Selection */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">1</span>
                      Select Hazard Type
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {HAZARD_TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, type: t.value }))}
                          className={`p-3 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            form.type === t.value
                              ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-lg`
                              : 'border-slate-200 hover:border-orange-300 bg-white'
                          }`}
                        >
                          <div className="text-2xl mb-1">{t.icon}</div>
                          <div className={`text-[10px] font-semibold leading-tight ${form.type === t.value ? 'text-white' : 'text-slate-700'}`}>
                            {t.value}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Severity Selection */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">2</span>
                      Severity Level
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {SEVERITIES.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                          className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            form.severity === s.value
                              ? `bg-gradient-to-br ${s.color} text-white border-transparent shadow-lg`
                              : 'border-slate-200 hover:border-orange-300 bg-white'
                          }`}
                        >
                          <div className="text-3xl mb-1">{s.icon}</div>
                          <div className={`text-sm font-bold ${form.severity === s.value ? 'text-white' : 'text-slate-700'}`}>{s.value}</div>
                          <div className={`text-[10px] ${form.severity === s.value ? 'text-white/80' : 'text-slate-500'}`}>{s.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">3</span>
                      Description & Media
                    </h3>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all outline-none resize-none text-sm"
                      rows={3}
                      placeholder="Describe the hazard in detail (optional)..."
                    />
                  </div>
                  
                  {/* Voice Recording - Compact */}
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MicIcon className="text-purple-600" style={{ fontSize: 18 }} />
                        <span className="font-semibold text-slate-700 text-sm">Voice Note</span>
                      </div>
                      {!audioUrl && (
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => setSelectedDeviceId(e.target.value)}
                          disabled={isRecording}
                          className="text-xs border border-purple-200 rounded-lg px-2 py-1 bg-white"
                        >
                          {audioDevices.length === 0 ? (
                            <option value="">No mic</option>
                          ) : (
                            audioDevices.map((device, idx) => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Mic ${idx + 1}`}
                              </option>
                            ))
                          )}
                        </select>
                      )}
                    </div>
                    
                    {micError && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">⚠️ {micError}</div>
                    )}
                    
                    {!audioUrl ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleVoiceRecording}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isRecording
                              ? 'bg-red-500 shadow-lg shadow-red-200 animate-pulse'
                              : 'bg-purple-500 shadow-lg shadow-purple-200 hover:bg-purple-600'
                          }`}
                        >
                          {isRecording ? <MicOffIcon className="text-white" style={{ fontSize: 20 }} /> : <MicIcon className="text-white" style={{ fontSize: 20 }} />}
                        </button>
                        <div className="flex-1">
                          {isRecording ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-0.5 h-6">
                                {voiceWaveform.map((height, i) => (
                                  <div key={i} className="flex-1 bg-red-400 rounded-full" style={{ height: `${Math.max(15, height)}%` }} />
                                ))}
                              </div>
                              <span className="text-red-600 font-mono text-sm font-bold">{formatDuration(recordingDuration)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">Tap to record voice description</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-purple-200">
                        <button type="button" onClick={togglePlayback} className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
                          {isPlaying ? <PauseIcon style={{ fontSize: 18 }} /> : <PlayArrowIcon style={{ fontSize: 18 }} />}
                        </button>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-800">Voice Recording</div>
                          <div className="text-xs text-slate-500">{formatDuration(recordingDuration)}</div>
                        </div>
                        <button type="button" onClick={removeVoiceRecording} className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                          <DeleteIcon style={{ fontSize: 16 }} />
                        </button>
                        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                      </div>
                    )}
                  </div>
                  
                  {/* Photos - Compact Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">4</span>
                        Photos
                      </h3>
                      {form.photos.length > 0 && (
                        <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{form.photos.length}/10</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {form.photos.map((file, idx) => {
                        const url = URL.createObjectURL(file)
                        return (
                          <div key={`${file.name}-${idx}`} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                            <img src={url} alt={file.name} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <CloseIcon className="text-white" style={{ fontSize: 16 }} />
                            </button>
                          </div>
                        )
                      })}
                      {form.photos.length < 10 && (
                        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-orange-400 flex items-center justify-center cursor-pointer transition-all hover:bg-orange-50">
                          <input type="file" multiple accept="image/*" onChange={onPhotoChange} className="hidden" />
                          <AddPhotoAlternateIcon className="text-slate-400" style={{ fontSize: 24 }} />
                        </label>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            {/* RIGHT SIDE - Map & Summary Panel */}
            <div className="flex-1 h-full flex flex-col bg-slate-50">
              {/* Map - Takes Most Space */}
              <div className="flex-1 relative">
                <MapContainer
                  center={[form.lat || 23.8103, form.lng || 90.4125]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  key={`${form.lat}-${form.lng}`}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker 
                    position={form.lat && form.lng ? [form.lat, form.lng] : null} 
                    setPosition={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} 
                  />
                </MapContainer>
                
                {/* Location Control Overlay */}
                <div className="absolute top-4 left-4 right-4 z-[1000]">
                  <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <LocationOnIcon className="text-white" style={{ fontSize: 20 }} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">Hazard Location</div>
                        <div className="text-xs text-slate-500">
                          {form.lat && form.lng ? `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}` : 'Click on map to set location'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if ('geolocation' in navigator) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude })),
                            (err) => alert('Could not get location: ' + err.message),
                            { enableHighAccuracy: true, timeout: 10000 }
                          )
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md"
                    >
                      <MyLocationIcon style={{ fontSize: 18 }} />
                      Locate Me
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Summary & Submit - Fixed Bottom */}
              <div className="flex-shrink-0 bg-white border-t border-slate-200 p-3">
                <div className="flex items-center justify-between gap-4">
                  {/* Summary Icons */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{HAZARD_TYPES.find(t => t.value === form.type)?.icon || '❓'}</span>
                      <span className="text-xs text-slate-600 font-medium">{form.type || 'Type'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{SEVERITIES.find(s => s.value === form.severity)?.icon || '❓'}</span>
                      <span className="text-xs text-slate-600 font-medium">{form.severity || 'Severity'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{form.lat && form.lng ? '📍' : '❓'}</span>
                      <span className="text-xs text-slate-600 font-medium">Location</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{form.photos.length > 0 ? '📷' : '➖'}</span>
                      <span className="text-xs text-slate-600 font-medium">{form.photos.length} Photos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{audioUrl ? '🎤' : '➖'}</span>
                      <span className="text-xs text-slate-600 font-medium">Voice</span>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting || !form.type || !form.severity || !form.lat || !form.lng}
                    className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <SendIcon style={{ fontSize: 18 }} />
                        Submit Hazard Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ MOBILE LAYOUT ============ */}
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
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <WarningIcon className="text-white" style={{ fontSize: 18 }} />
                  </div>
                  <span className="font-bold text-slate-800">Report Hazard</span>
                </div>
              </div>
              
              {/* Step indicator in header */}
              <div className="text-xs font-medium text-slate-500">
                Step {currentStep + 1}/{steps.length}
              </div>
            </div>
          </header>
          
          {/* Mobile Content */}
          <main className="pt-16 pb-24 px-4 min-h-screen">
            {/* Login Prompt */}
            {!isAuthenticated && (
              <div className="mt-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="text-center">
                  <h3 className="font-semibold text-slate-800 text-sm">Sign in to Report</h3>
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all w-full"
                  >
                    <GoogleIcon className="text-blue-500" style={{ fontSize: 18 }} />
                    <span className="font-medium text-slate-700 text-sm">Continue with Google</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} totalSteps={steps.length} steps={steps} />
            
            {/* Step Header */}
            <div className={`mt-3 mb-4 bg-gradient-to-r ${
              currentStep === 0 ? 'from-orange-500 to-red-500' :
              currentStep === 1 ? 'from-purple-500 to-indigo-500' :
              currentStep === 2 ? 'from-blue-500 to-cyan-500' :
              'from-emerald-500 to-teal-500'
            } rounded-xl p-4 shadow-lg`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  {(() => {
                    const Icon = steps[currentStep].icon
                    return <Icon className="text-white" style={{ fontSize: 24 }} />
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{steps[currentStep].label}</h2>
                  <p className="text-white/70 text-xs">
                    {currentStep === 0 && 'Select hazard type and severity'}
                    {currentStep === 1 && 'Add description and media'}
                    {currentStep === 2 && 'Confirm hazard location'}
                    {currentStep === 3 && 'Review and submit'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-4">
              <form onSubmit={onSubmit}>
                {currentStep === 0 && <HazardTypeSection />}
                {currentStep === 1 && <DescriptionSection />}
                {currentStep === 2 && <LocationSection />}
                {currentStep === 3 && <SubmitSection />}
              </form>
            </div>
          </main>
          
          {/* Mobile Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 safe-area-bottom">
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <NavigateBeforeIcon style={{ fontSize: 20 }} />
                  Back
                </button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    canProceed()
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Next
                  <NavigateNextIcon style={{ fontSize: 20 }} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitting || !canProceed()}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    canProceed() && !isSubmitting
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <SendIcon style={{ fontSize: 20 }} />
                      Submit Report
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
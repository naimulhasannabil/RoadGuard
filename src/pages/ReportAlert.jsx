
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'
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
  { value: 'Low', color: 'from-green-500 to-green-600', icon: '🟢' },
  { value: 'Medium', color: 'from-orange-500 to-orange-600', icon: '🟠' },
  { value: 'High', color: 'from-red-500 to-red-600', icon: '🔴' }
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

export default function ReportAlert() {
  const navigate = useNavigate()
  const { addAlert } = useAlerts()
  const { showToast } = useNotifications()
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
    setForm(f => ({ ...f, photos: files }))
  }

  const removePhoto = (index) => {
    setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      addAlert({
        type: form.type,
        severity: form.severity,
        description: form.description,
        photos: form.photos,
        lat: form.lat,
        lng: form.lng,
        contributor: 'You',
        alternateRoutes: form.alternateRoutes,
        voiceNote: form.voiceNote
      })
      
      // Show success notification
      showToast(`${form.type} hazard reported successfully!`, 'success', 5000)
      
      setIsSubmitting(false)
      navigate('/')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full shadow-xl mb-4">
            <WarningIcon className="text-white" style={{ fontSize: 36 }} />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Report Road Hazard
          </h2>
          <p className="text-gray-600 text-lg">Help keep our roads safe for everyone</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Hazard Type Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
              <WarningIcon className="text-orange-500" />
              Hazard Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {HAZARD_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    form.type === t.value
                      ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-lg`
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <div className={`text-xs font-semibold ${
                    form.type === t.value ? 'text-white' : 'text-gray-700'
                  }`}>
                    {t.value}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <label className="block text-lg font-bold text-gray-800 mb-4">Severity Level</label>
            <div className="grid grid-cols-3 gap-4">
              {SEVERITIES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                  className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    form.severity === s.value
                      ? `bg-gradient-to-br ${s.color} text-white border-transparent shadow-lg`
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  <div className="text-4xl mb-2">{s.icon}</div>
                  <div className={`text-lg font-bold ${
                    form.severity === s.value ? 'text-white' : 'text-gray-700'
                  }`}>
                    {s.value}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <label className="block text-lg font-bold text-gray-800 mb-3">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
              rows={4}
              placeholder="Describe the hazard in detail (e.g., Large pothole near bridge, causing traffic delays...)"
            />
          </div>

          {/* Voice Reporting Feature */}
          <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-2xl shadow-xl p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <MicIcon className="text-purple-600" />
                Voice Reporting
                <span className="text-xs font-normal bg-purple-100 text-purple-700 px-2 py-1 rounded-full ml-2">
                  NEW
                </span>
              </label>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Record your voice to describe the hazard. Your audio will be saved and the text will be automatically transcribed.
            </p>
            
            {/* Microphone Selector */}
            <div className="mb-4 p-4 bg-white rounded-xl border-2 border-purple-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎤 Select Microphone:
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                disabled={isRecording}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none bg-white disabled:bg-gray-100"
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
            
            {/* Error Message */}
            {micError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⚠️ {micError}
              </div>
            )}
            
            {/* Recording Controls */}
            {!audioUrl ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Voice Record Button */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-105 ${
                    isRecording
                      ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-200'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-200 hover:shadow-xl'
                  }`}
                >
                  {isRecording ? (
                    <MicOffIcon className="text-white" style={{ fontSize: 32 }} />
                  ) : (
                    <MicIcon className="text-white" style={{ fontSize: 32 }} />
                  )}
                  {isRecording && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                  )}
                </button>
                
                {/* Voice Waveform Visualization */}
                <div className="flex-1 w-full">
                  {isRecording ? (
                    <div className="bg-white rounded-xl p-4 border-2 border-red-200">
                      <div className="flex items-center gap-1 h-12">
                        {voiceWaveform.map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-red-500 to-orange-500 rounded-full transition-all duration-100"
                            style={{ height: `${Math.max(8, height)}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                          <GraphicEqIcon style={{ fontSize: 16 }} className="animate-pulse" />
                          Recording...
                        </div>
                        <div className="text-red-600 font-mono text-sm font-bold">
                          {formatDuration(recordingDuration)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-200 text-center">
                      <p className="text-gray-500 text-sm">
                        Click the microphone to start voice recording
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Recorded Audio Display */
              <div className="bg-white rounded-xl p-5 border-2 border-purple-200">
                <div className="flex items-center gap-4">
                  {/* Audio Icon */}
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <AudiotrackIcon className="text-white" style={{ fontSize: 28 }} />
                  </div>
                  
                  {/* Audio Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">Voice Recording</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircleIcon style={{ fontSize: 12 }} />
                        Saved
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {formatDuration(recordingDuration)} • Audio file attached
                    </div>
                  </div>
                  
                  {/* Playback Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      {isPlaying ? (
                        <PauseIcon style={{ fontSize: 24 }} />
                      ) : (
                        <PlayArrowIcon style={{ fontSize: 24 }} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={removeVoiceRecording}
                      className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 transition-all"
                    >
                      <DeleteIcon style={{ fontSize: 20 }} />
                    </button>
                  </div>
                </div>
                
                {/* Audio Player */}
                <div className="mt-3">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    controls
                    preload="auto"
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-12"
                    style={{ minHeight: '48px' }}
                  />
                </div>
                
                {/* Audio Waveform Visual (Static) */}
                <div className="mt-4 flex items-center gap-0.5 h-8">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-purple-400 to-indigo-400 rounded-full"
                      style={{ height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 30}%` }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Voice Transcript */}
            {voiceTranscript && (
              <div className="mt-4 p-4 bg-white rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 mb-2">
                  <CheckCircleIcon style={{ fontSize: 16 }} />
                  Voice Transcript (Auto-generated):
                </div>
                <p className="text-gray-700 text-sm italic">"{voiceTranscript.trim()}"</p>
              </div>
            )}
          </div>

{/* Photos Upload */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
              <PhotoCameraIcon className="text-orange-500" />
              Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onPhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <PhotoCameraIcon className="text-gray-400 mx-auto mb-2" style={{ fontSize: 48 }} />
                <p className="text-gray-600 font-semibold">Click to upload photos</p>
                <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</p>
              </label>
            </div>
            {form.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {form.photos.map((f, idx) => {
                  const url = URL.createObjectURL(f)
                  return (
                    <div key={url} className="relative group">
                      <img src={url} alt={f.name} className="w-full h-32 object-cover rounded-xl shadow-md" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Location Picker with Map */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LocationOnIcon className="text-blue-600" style={{ fontSize: 28 }} />
                <div>
                  <div className="text-sm font-semibold text-blue-900">Hazard Location</div>
                  <div className="text-blue-700 text-sm">
                    {form.lat && form.lng ? (
                      <span className="flex items-center gap-1">
                        <CheckCircleIcon style={{ fontSize: 14 }} />
                        {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Detecting...
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }))
                        },
                        (err) => alert('Could not get location: ' + err.message),
                        { enableHighAccuracy: true, timeout: 10000 }
                      )
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <MyLocationIcon style={{ fontSize: 16 }} />
                  Locate Me
                </button>
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  <EditLocationIcon style={{ fontSize: 14 }} />
                  Click map
                </div>
              </div>
            </div>
            
            {/* Mini Map for Location Selection */}
            <div className="rounded-xl overflow-hidden border-2 border-blue-200 shadow-inner" style={{ height: '200px' }}>
              <MapContainer
                center={[form.lat || 23.8103, form.lng || 90.4125]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                key={`${form.lat}-${form.lng}`}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={form.lat && form.lng ? [form.lat, form.lng] : null} setPosition={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} />
              </MapContainer>
            </div>
            <p className="text-xs text-blue-600 mt-2 text-center">📍 Click on the map to set exact hazard location or use "Locate Me" button</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !form.type || !form.severity}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting Alert...
              </>
            ) : (
              <>
                <SendIcon />
                Submit Alert
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
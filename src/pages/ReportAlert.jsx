import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'
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
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloseIcon from '@mui/icons-material/Close'
import CollectionsIcon from '@mui/icons-material/Collections'

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

export default function ReportAlert() {
  const navigate = useNavigate()
  const { addAlert } = useAlerts()
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
        (pos) => setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude })),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
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

{/* Photos Upload - Enhanced Multiple Image Upload */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <CollectionsIcon className="text-orange-500" />
                Photos (Optional)
              </label>
              {form.photos.length > 0 && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                  {form.photos.length}/10 photos
                </span>
              )}
            </div>
            
            {/* Upload Area */}
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              form.photos.length >= 10 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50 cursor-pointer'
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
                  className={form.photos.length >= 10 ? 'text-gray-300' : 'text-orange-400'} 
                  style={{ fontSize: 48 }} 
                />
                <p className={`font-semibold mt-2 ${form.photos.length >= 10 ? 'text-gray-400' : 'text-gray-600'}`}>
                  {form.photos.length >= 10 
                    ? 'Maximum 10 photos reached' 
                    : form.photos.length > 0 
                      ? 'Click to add more photos' 
                      : 'Click to upload photos'
                  }
                </p>
                <p className="text-gray-400 text-sm mt-1">PNG, JPG, WEBP • Max 10MB each • Up to 10 photos</p>
              </label>
            </div>
            
            {/* Photo Gallery Preview */}
            {form.photos.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Uploaded Photos</span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, photos: [] }))}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <DeleteIcon style={{ fontSize: 14 }} />
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {form.photos.map((file, idx) => {
                    const url = URL.createObjectURL(file)
                    return (
                      <div 
                        key={`${file.name}-${idx}`} 
                        className="relative group aspect-square rounded-xl overflow-hidden shadow-md border-2 border-gray-100 hover:border-orange-300 transition-all"
                      >
                        <img 
                          src={url} 
                          alt={file.name} 
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          {/* Move Left */}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => movePhoto(idx, -1)}
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all"
                              title="Move Left"
                            >
                              <ArrowBackIcon style={{ fontSize: 16 }} className="text-gray-700" />
                            </button>
                          )}
                          
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="p-1.5 bg-red-500 rounded-full shadow-md hover:bg-red-600 transition-all"
                            title="Remove Photo"
                          >
                            <CloseIcon style={{ fontSize: 16 }} className="text-white" />
                          </button>
                          
                          {/* Move Right */}
                          {idx < form.photos.length - 1 && (
                            <button
                              type="button"
                              onClick={() => movePhoto(idx, 1)}
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all"
                              title="Move Right"
                            >
                              <ArrowForwardIcon style={{ fontSize: 16 }} className="text-gray-700" />
                            </button>
                          )}
                        </div>
                        
                        {/* Photo number badge */}
                        <div className="absolute top-2 left-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                          {idx + 1}
                        </div>
                        
                        {/* File size */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs truncate">{file.name}</p>
                          <p className="text-white/70 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Add More Button (inline) */}
                  {form.photos.length < 10 && (
                    <label 
                      htmlFor="photo-upload"
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-orange-50"
                    >
                      <AddPhotoAlternateIcon className="text-gray-400" style={{ fontSize: 32 }} />
                      <span className="text-xs text-gray-500 mt-1">Add More</span>
                    </label>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <span>💡</span>
                  Tip: Hover over photos to reorder or remove them. First photo will be the main image.
                </p>
              </div>
            )}
          </div>

          {/* Location Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3">
              <LocationOnIcon className="text-blue-600" style={{ fontSize: 32 }} />
              <div>
                <div className="text-sm font-semibold text-blue-900">Current Location</div>
                <div className="text-blue-700">
                  {form.lat && form.lng ? (
                    <span className="flex items-center gap-2">
                      <CheckCircleIcon style={{ fontSize: 18 }} />
                      {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Detecting location...
                    </span>
                  )}
                </div>
              </div>
            </div>
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
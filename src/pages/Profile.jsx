import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'
import { useAuth } from '../context/AuthContext'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import VerifiedIcon from '@mui/icons-material/Verified'
import ReportIcon from '@mui/icons-material/Report'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EditIcon from '@mui/icons-material/Edit'
import EmailIcon from '@mui/icons-material/Email'
import LogoutIcon from '@mui/icons-material/Logout'

export default function Profile() {
  const { alerts } = useAlerts()
  const { user, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()
  const [animateStats, setAnimateStats] = useState(false)
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])
  
  const mine = useMemo(() => alerts.filter(a => a.contributor === (user?.displayName || 'You')), [alerts, user])
  const totalReports = mine.length
  const verified = mine.filter(a => a.verified).length
  const contributionScore = mine.reduce((sum, a) => sum + (a.votesUp || 0), 0)
  const level = contributionScore >= 15 ? 'Gold' : contributionScore >= 5 ? 'Silver' : 'Bronze'
  const levelColor = level === 'Gold' ? 'from-yellow-400 to-yellow-600' : level === 'Silver' ? 'from-gray-300 to-gray-500' : 'from-amber-600 to-amber-800'
  const levelIcon = level === 'Gold' ? '🏆' : level === 'Silver' ? '🥈' : '🥉'
  
  const severityBreakdown = useMemo(() => {
    return {
      High: mine.filter(a => a.severity === 'High').length,
      Medium: mine.filter(a => a.severity === 'Medium').length,
      Low: mine.filter(a => a.severity === 'Low').length
    }
  }, [mine])

  const achievements = [
    { name: 'First Report', unlocked: totalReports >= 1, icon: '🎯' },
    { name: 'Reporter', unlocked: totalReports >= 5, icon: '📝' },
    { name: 'Guardian', unlocked: totalReports >= 10, icon: '🛡️' },
    { name: 'Verified Hero', unlocked: verified >= 3, icon: '✅' },
    { name: 'Community Star', unlocked: contributionScore >= 10, icon: '⭐' },
    { name: 'Road Warrior', unlocked: contributionScore >= 20, icon: '💪' },
  ]

  useEffect(() => {
    setTimeout(() => setAnimateStats(true), 100)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'}
                  className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <AccountCircleIcon className="text-white" style={{ fontSize: 60 }} />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                <div className={`bg-gradient-to-br ${levelColor} rounded-full px-3 py-1 text-white text-xs font-bold`}>
                  {level}
                </div>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {user?.displayName || 'Road Guardian'}
              </h1>
              {user?.email && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 mb-2">
                  <EmailIcon style={{ fontSize: 18 }} />
                  <span className="text-sm">{user.email}</span>
                </div>
              )}
              <p className="text-gray-600 text-lg">Making roads safer, one report at a time</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="text-2xl">{levelIcon}</span>
                <span className="text-sm font-semibold text-gray-700">{level} Level Contributor</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                <EditIcon style={{ fontSize: 18 }} />
                Edit Profile
              </button>
              <button 
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
              >
                <LogoutIcon style={{ fontSize: 18 }} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${animateStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-between mb-3">
              <ReportIcon style={{ fontSize: 40 }} className="opacity-80" />
              <TrendingUpIcon className="opacity-60" />
            </div>
            <div className="text-4xl font-bold mb-1">{totalReports}</div>
            <div className="text-blue-100 text-sm font-medium">Total Reports</div>
          </div>

          <div className={`bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${animateStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3">
              <VerifiedIcon style={{ fontSize: 40 }} className="opacity-80" />
              <span className="text-green-100 text-2xl">✓</span>
            </div>
            <div className="text-4xl font-bold mb-1">{verified}</div>
            <div className="text-green-100 text-sm font-medium">Verified Alerts</div>
          </div>

          <div className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${animateStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-3">
              <ThumbUpIcon style={{ fontSize: 40 }} className="opacity-80" />
              <LocalFireDepartmentIcon className="opacity-60" />
            </div>
            <div className="text-4xl font-bold mb-1">{contributionScore}</div>
            <div className="text-purple-100 text-sm font-medium">Contribution Score</div>
          </div>

          <div className={`bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${animateStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-3">
              <EmojiEventsIcon style={{ fontSize: 40 }} className="opacity-80" />
              <span className="text-4xl opacity-60">{levelIcon}</span>
            </div>
            <div className="text-4xl font-bold mb-1">{level}</div>
            <div className="text-orange-100 text-sm font-medium">Current Level</div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <EmojiEventsIcon className="text-yellow-500" style={{ fontSize: 32 }} />
            Achievements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400 shadow-md'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2 text-center">{achievement.icon}</div>
                <div className={`text-xs font-semibold text-center ${
                  achievement.unlocked ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {achievement.name}
                </div>
                {achievement.unlocked && (
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                    <VerifiedIcon style={{ fontSize: 16 }} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Report Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">Report Breakdown</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-red-600">🔴 High Severity</span>
                  <span className="font-bold">{severityBreakdown.High}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${totalReports ? (severityBreakdown.High / totalReports) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-orange-600">🟠 Medium Severity</span>
                  <span className="font-bold">{severityBreakdown.Medium}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${totalReports ? (severityBreakdown.Medium / totalReports) * 100 : 0}%`, transitionDelay: '200ms' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-green-600">🟢 Low Severity</span>
                  <span className="font-bold">{severityBreakdown.Low}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${totalReports ? (severityBreakdown.Low / totalReports) * 100 : 0}%`, transitionDelay: '400ms' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            {mine.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {mine.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                      alert.severity === 'High' ? 'bg-red-500' :
                      alert.severity === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{alert.type}</div>
                      <div className="text-sm text-gray-500">{new Date(alert.timestamp).toLocaleDateString()}</div>
                    </div>
                    {alert.verified && <VerifiedIcon className="text-blue-500" style={{ fontSize: 20 }} />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <ReportIcon style={{ fontSize: 48 }} className="mx-auto mb-2 opacity-30" />
                <p>No reports yet. Start contributing!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
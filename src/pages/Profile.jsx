import { useMemo } from 'react'
import { useAlerts } from '../context/AlertsContext'

export default function Profile() {
  const { alerts } = useAlerts()
  const mine = useMemo(() => alerts.filter(a => a.contributor === 'You'), [alerts])
  const totalReports = mine.length
  const verified = mine.filter(a => a.verified).length
  const contributionScore = mine.reduce((sum, a) => sum + (a.votesUp || 0), 0)
  const level = contributionScore >= 15 ? 'Gold' : contributionScore >= 5 ? 'Silver' : 'Bronze'

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-2">User Profile</h2>
      <p className="mt-2">Total Reports: {totalReports}</p>
      <p>Verified Alerts: {verified}</p>
      <p>Contribution Score (upvotes on your alerts): {contributionScore}</p>
      <p>Level: {level}</p>
    </div>
  )
}
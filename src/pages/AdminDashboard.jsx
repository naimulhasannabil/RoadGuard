import { useState, useEffect } from 'react';
import { useAlerts } from '../context/AlertsContext'; // Assuming this provides alerts and methods

export default function AdminDashboard() {
  const { alerts, updateAlert, removeAlert } = useAlerts(); // Enhanced: Assume context has update/remove methods
  const [filter, setFilter] = useState('active');
  const [ttlSettings, setTtlSettings] = useState({ low: 30, medium: 60, high: 120 });
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Mock data for users and analytics (replace with API fetches)
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({ topAreas: [], peakTimes: '', topContributors: [] });

  useEffect(() => {
    // Mock fetch for users and analytics
    setUsers([
      { id: 1, name: 'User1', reports: 5, spamCount: 2 },
      { id: 2, name: 'User2', reports: 10, spamCount: 0 },
      // Add more as needed
    ]);
    setAnalytics({
      topAreas: ['Area A', 'Area B'],
      peakTimes: 'Evenings',
      topContributors: ['User2', 'User3'],
    });
  }, []);

  const filteredAlerts = alerts?.filter(alert => {
    if (filter === 'active') return !alert.expired && alert.verified;
    if (filter === 'expired') return alert.expired;
    if (filter === 'verified') return alert.verified;
    return true;
  }) || [];

  const itemsPerPage = 10;
  const paginatedAlerts = filteredAlerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);

  const handleRemoveAlert = (id) => {
    if (window.confirm('Confirm removal?')) {
      removeAlert(id); // Assume context method
    }
  };

  const openEditModal = (alert) => {
    setSelectedAlert(alert);
    setEditedDescription(alert.description);
    setIsVerified(alert.verified);
    setIsExpired(alert.expired);
    setEditModalOpen(true);
  };

  const saveEdit = () => {
    if (selectedAlert) {
      updateAlert(selectedAlert.id, {
        description: editedDescription,
        verified: isVerified,
        expired: isExpired,
      });
    }
    setEditModalOpen(false);
  };

  const openBanModal = (user) => {
    setSelectedUser(user);
    setBanModalOpen(true);
  };

  const confirmBan = () => {
    // TODO: Implement ban logic (e.g., API call)
    console.log(`Banned user ${selectedUser.id}`);
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setBanModalOpen(false);
  };

  const handleTtlChange = (type, value) => {
    setTtlSettings(prev => ({ ...prev, [type]: parseInt(value) || 0 }));
  };

  const saveTtlSettings = () => {
    // TODO: Save to backend
    console.log('TTL settings saved:', ttlSettings);
    alert('Settings saved!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center">RoadGuard Admin Dashboard</h2>

      {/* Alerts Management */}
      <section className="mb-8 bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Alerts Management</h3>
        <div className="mb-4 flex justify-between">
          <div>
            <label className="mr-2">Filter:</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="border p-2 rounded">
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="verified">Verified</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            Page {currentPage} of {totalPages}
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="ml-2 bg-gray-300 px-2 py-1 rounded">Prev</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="ml-2 bg-gray-300 px-2 py-1 rounded">Next</button>
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">ID</th>
              <th className="p-2">Description</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAlerts.map(alert => (
              <tr key={alert.id} className="border-b">
                <td className="p-2">{alert.id}</td>
                <td className="p-2">{alert.description}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded ${alert.expired ? 'bg-red-200' : 'bg-green-200'}`}>
                    {alert.expired ? 'Expired' : 'Active'}
                  </span>
                  {alert.verified && <span className="ml-2 bg-blue-200 px-2 py-1 rounded">Verified</span>}
                </td>
                <td className="p-2">
                  <button onClick={() => openEditModal(alert)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                  <button onClick={() => handleRemoveAlert(alert.id)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Edit Alert Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">Edit Alert {selectedAlert?.id}</h4>
            <label className="block mb-2">Description:</label>
            <input
              type="text"
              value={editedDescription}
              onChange={e => setEditedDescription(e.target.value)}
              className="w-full border p-2 mb-4 rounded"
            />
            <div className="mb-4">
              <label className="mr-2">Verified:</label>
              <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} />
            </div>
            <div className="mb-4">
              <label className="mr-2">Expired:</label>
              <input type="checkbox" checked={isExpired} onChange={e => setIsExpired(e.target.checked)} />
            </div>
            <div className="flex justify-end">
              <button onClick={() => setEditModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded mr-2">Cancel</button>
              <button onClick={saveEdit} className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* User Management */}
      <section className="mb-8 bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">User Management</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Name</th>
              <th className="p-2">Reports</th>
              <th className="p-2">Spam Count</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.reports}</td>
                <td className="p-2">{user.spamCount}</td>
                <td className="p-2">
                  <button onClick={() => openBanModal(user)} className="bg-red-500 text-white px-2 py-1 rounded">Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Ban User Modal */}
      {banModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">Ban User {selectedUser?.name}?</h4>
            <p className="mb-4">This user has {selectedUser?.spamCount} spam reports. Confirm ban?</p>
            <div className="flex justify-end">
              <button onClick={() => setBanModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded mr-2">Cancel</button>
              <button onClick={confirmBan} className="bg-red-500 text-white px-4 py-2 rounded">Ban</button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      <section className="mb-8 bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-100 rounded">
            <h4 className="font-medium mb-2">Top Congested Areas</h4>
            <ul className="list-disc pl-5">
              {analytics.topAreas.map(area => <li key={area}>{area}</li>)}
            </ul>
            {/* Placeholder for chart: <div className="h-32 bg-gray-200">Chart Here</div> */}
          </div>
          <div className="p-4 bg-green-100 rounded">
            <h4 className="font-medium mb-2">Peak Alert Times</h4>
            <p>{analytics.peakTimes}</p>
            {/* Placeholder for chart: <div className="h-32 bg-gray-200">Chart Here</div> */}
          </div>
          <div className="p-4 bg-yellow-100 rounded">
            <h4 className="font-medium mb-2">Top Contributors</h4>
            <ul className="list-disc pl-5">
              {analytics.topContributors.map(contrib => <li key={contrib}>{contrib}</li>)}
            </ul>
            {/* Placeholder for chart: <div className="h-32 bg-gray-200">Chart Here</div> */}
          </div>
        </div>
      </section>

      {/* Settings */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Adjust TTL Settings (in minutes)</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Low Severity:</label>
            <input
              type="number"
              min="1"
              value={ttlSettings.low}
              onChange={e => handleTtlChange('low', e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Medium Severity:</label>
            <input
              type="number"
              min="1"
              value={ttlSettings.medium}
              onChange={e => handleTtlChange('medium', e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">High Severity:</label>
            <input
              type="number"
              min="1"
              value={ttlSettings.high}
              onChange={e => handleTtlChange('high', e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <button onClick={saveTtlSettings} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Save Settings</button>
        </div>
      </section>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import FooterArabic from '../components/FooterArabic';
import { ROUTES } from '../routes';
import { useTranslation } from 'react-i18next';

const ModeratorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [traders, setTraders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assigningTraderId, setAssigningTraderId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  useEffect(() => {
    fetchTraders();
    fetchEmployees();
  }, []);

  const fetchTraders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/traders?isVerified=false', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter strictly for unverified if API returns mixed, though query param should handle it
      setTraders(response.data.data.filter(t => !t.isVerified));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching traders:', err);
      setError('Failed to fetch traders');
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleVerify = async (traderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/traders/${traderId}`, 
        { isVerified: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Trader verified successfully');
      fetchTraders(); // Refresh list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to verify trader');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAssign = async (traderId) => {
    if (!selectedEmployeeId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/traders/${traderId}/assign`, 
        { employeeId: selectedEmployeeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Trader assigned to employee successfully');
      setAssigningTraderId(null);
      setSelectedEmployeeId('');
      fetchTraders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to assign trader');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50 min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Moderator Dashboard</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Pending Trader Verifications</h2>
            
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : traders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded">No pending traders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {traders.map((trader) => (
                      <tr key={trader.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 whitespace-nowrap">{trader.companyName}</td>
                        <td className="py-4 px-4 whitespace-nowrap">{trader.name}</td>
                        <td className="py-4 px-4 whitespace-nowrap">{trader.email}</td>
                        <td className="py-4 px-4 whitespace-nowrap">{trader.phone || '-'}</td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {assigningTraderId === trader.id ? (
                            <div className="flex items-center space-x-2">
                              <select 
                                className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                              >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleAssign(trader.id)}
                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition"
                                disabled={!selectedEmployeeId}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setAssigningTraderId(null)}
                                className="text-gray-600 hover:text-gray-800 px-2 py-1 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                                <span className="mr-2 text-sm text-gray-600">
                                    {employees.find(e => e.id === trader.employeeId)?.name || 'Unassigned'}
                                </span>
                                <button 
                                    onClick={() => {
                                        setAssigningTraderId(trader.id);
                                        setSelectedEmployeeId(trader.employeeId || '');
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Edit
                                </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleVerify(trader.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-sm transition duration-150 ease-in-out mr-2"
                          >
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <FooterArabic />
    </div>
  );
};

export default ModeratorDashboard;

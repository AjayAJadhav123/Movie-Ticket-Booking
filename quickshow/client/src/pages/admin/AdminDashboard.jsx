import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, Users, DollarSign, Ticket } from 'lucide-react';
import Loading from '../../components/Loading';

export default function AdminDashboard() {
  const { apiClient, loading } = useApp();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeShows: 0,
    registeredUsers: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/booking/admin-stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: Ticket,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Shows',
      value: stats.activeShows,
      icon: BarChart3,
      color: 'bg-purple-500',
    },
    {
      label: 'Registered Users',
      value: stats.registeredUsers,
      icon: Users,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-gray-600 mb-1 md:mb-2 text-xs md:text-sm">{card.label}</p>
                  <p className="text-lg md:text-3xl font-bold truncate">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 md:p-4 rounded-lg text-white flex-shrink-0`}>
                  <Icon size={24} className="md:hidden" />
                  <Icon size={32} className="hidden md:block" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Quick Actions</h2>
          <div className="space-y-2 md:space-y-3">
            <a
              href="/admin/movies"
              className="block w-full btn-primary text-center text-sm md:text-base py-2 md:py-3"
            >
              Manage Movies
            </a>
            <a
              href="/admin/add-shows"
              className="block w-full btn-primary text-center text-sm md:text-base py-2 md:py-3"
            >
              Add New Show
            </a>
            <a
              href="/admin/list-shows"
              className="block w-full btn-secondary text-center text-sm md:text-base py-2 md:py-3"
            >
              Manage Shows
            </a>
            <a
              href="/admin/bookings"
              className="block w-full btn-outline text-center text-sm md:text-base py-2 md:py-3"
            >
              View Bookings
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">System Status</h2>
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm md:text-base">API Server</span>
              <span className="bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm md:text-base">Database</span>
              <span className="bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm md:text-base">Email Service</span>
              <span className="bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

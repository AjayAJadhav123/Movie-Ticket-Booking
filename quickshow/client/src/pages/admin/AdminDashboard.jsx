import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Ticket,
  Film,
  Building2,
  Monitor,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Star,
  Activity,
  IndianRupee,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { format } from 'date-fns';

// ── Stat Card Component ────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, colorClass, secondaryLabel, secondaryValue, prefix = '' }) {
  return (
    <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/50 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start gap-4">
        <div className={`p-3.5 rounded-xl ${colorClass} shrink-0`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <div className="flex-1 mt-0.5">
          <p className="text-[13px] font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-[26px] font-bold text-slate-100 tracking-tight truncate leading-tight">
            {prefix}{value}
          </p>
        </div>
      </div>
      
      {secondaryLabel && (
        <div className="mt-4 pt-3 border-t border-slate-800/50">
           <p className="text-[12px] font-medium text-slate-400 mb-0.5">{secondaryLabel}</p>
           <p className="text-[14px] font-semibold text-slate-300">{prefix}{secondaryValue}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const { apiClient } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Data states
  const [counts, setCounts] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [popularShows, setPopularShows] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [countsRes, overviewRes, bookingStatusRes, popularShowsRes] = await Promise.all([
        apiClient.get('/api/admin/analytics/counts'),
        apiClient.get('/api/admin/analytics/overview'),
        apiClient.get('/api/admin/analytics/booking-status?range=30d'),
        apiClient.get('/api/admin/analytics/popular-shows?range=30d')
      ]);

      if (countsRes.data.success) {
        setCounts({
          ...countsRes.data.data,
          occupancyPercentage: overviewRes.data?.data?.occupancyPercentage || 0,
        });
        setRecentBookings(bookingStatusRes.data?.data?.recentBookings || []);
        setPopularShows(popularShowsRes.data?.data?.slice(0, 5) || []);
        setLastRefresh(new Date());
      } else {
        setError('Failed to load dashboard statistics.');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load dashboard. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !counts) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-48 h-8 bg-slate-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#0f172a] p-5 rounded-xl border border-slate-800/50 h-32 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800/50"></div>
                <div className="space-y-2 flex-1">
                  <div className="w-24 h-4 bg-slate-800/50 rounded"></div>
                  <div className="w-16 h-8 bg-slate-800/50 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          {lastRefresh && (
            <p className="text-[13px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
              <Clock size={14} />
              Last updated: {format(lastRefresh, 'MMM dd, yyyy hh:mm a')}
            </p>
          )}
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-[13px] font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 text-sm font-medium">
          <AlertCircle size={18} className="text-red-500" />
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      {counts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard 
            label="Total Revenue" 
            value={counts.totalRevenue?.toLocaleString('en-IN')} 
            prefix="₹" 
            icon={IndianRupee} 
            colorClass="bg-red-500/10 text-red-500"
            secondaryLabel="Today's Revenue"
            secondaryValue={counts.todayRevenue?.toLocaleString('en-IN')}
          />
          <StatCard 
            label="Total Bookings" 
            value={counts.totalBookings?.toLocaleString()} 
            icon={Ticket} 
            colorClass="bg-teal-50 text-teal-600"
            secondaryLabel="Today's Bookings"
            secondaryValue="0"
          />
          <StatCard 
            label="Total Movies" 
            value={counts.totalMovies?.toLocaleString()} 
            icon={Film} 
            colorClass="bg-fuchsia-50 text-fuchsia-600"
            secondaryLabel="Active Movies"
            secondaryValue={counts.totalMovies?.toLocaleString()}
          />
          <StatCard 
            label="Total Users" 
            value={counts.totalUsers?.toLocaleString()} 
            icon={Users} 
            colorClass="bg-blue-50 text-blue-600"
            secondaryLabel="Active Users"
            secondaryValue={counts.totalUsers?.toLocaleString()}
          />
          <StatCard 
            label="Total Cinemas" 
            value={counts.totalCinemas?.toLocaleString()} 
            icon={Building2} 
            colorClass="bg-orange-50 text-orange-600"
            secondaryLabel="Active Cinemas"
            secondaryValue={counts.totalCinemas?.toLocaleString()}
          />
          <StatCard 
            label="Total Screens" 
            value={counts.totalScreens?.toLocaleString()} 
            icon={Monitor} 
            colorClass="bg-sky-50 text-sky-600"
            secondaryLabel="Active Screens"
            secondaryValue={counts.totalScreens?.toLocaleString()}
          />
          <StatCard 
            label="Active Shows" 
            value={counts.totalShows?.toLocaleString()} 
            icon={Calendar} 
            colorClass="bg-pink-50 text-pink-600"
            secondaryLabel="Today's Shows"
            secondaryValue={counts.totalShows?.toLocaleString()}
          />
          <StatCard 
            label="Occupancy Rate" 
            value={`${counts.occupancyPercentage}%`} 
            icon={TrendingUp} 
            colorClass="bg-emerald-50 text-emerald-600"
            secondaryLabel="Average Occupancy"
            secondaryValue={`${counts.occupancyPercentage}%`}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Bookings List */}
        <div className="xl:col-span-2 bg-[#0f172a] border border-slate-800/50 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 flex items-center justify-between shrink-0 border-b border-slate-800/50">
            <h2 className="text-[15px] font-semibold text-slate-100 flex items-center gap-2">
              <Activity size={16} className="text-red-500" />
              Recent Bookings
            </h2>
            <Link to="/admin/bookings" className="text-[13px] font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {recentBookings.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-[#09090b] rounded-xl flex items-center justify-center mb-4">
                   <Ticket size={28} className="text-slate-300" />
                 </div>
                 <p className="text-white font-semibold mb-1">No bookings found</p>
                 <p className="text-sm text-slate-500">Recent bookings will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-[13px] text-left border-collapse">
                <thead className="text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800/50 bg-slate-800/20">
                  <tr>
                    <th className="px-6 py-4 font-bold">Movie</th>
                    <th className="px-6 py-4 font-bold">Cinema</th>
                    <th className="px-6 py-4 font-bold">Screen</th>
                    <th className="px-6 py-4 font-bold">Seats</th>
                    <th className="px-6 py-4 font-bold">Amount</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-200 truncate max-w-[180px]">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-10 bg-slate-800 rounded shrink-0 overflow-hidden">
                             {/* Placeholder for movie thumbnail if available */}
                             <div className="w-full h-full flex items-center justify-center bg-red-500/10 text-indigo-300">
                               <Film size={14} />
                             </div>
                           </div>
                           <span className="truncate">{booking.movieTitle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-300 whitespace-nowrap">
                        {booking.theatre || '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {booking.screen || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {booking.seats?.length || 0}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-200 whitespace-nowrap">
                        ₹{booking.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                          booking.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-[12px]">
                        {format(new Date(booking.createdAt), 'MMM dd, HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {recentBookings.length > 0 && (
            <div className="p-4 border-t border-slate-800/50 text-center">
              <Link to="/admin/bookings" className="text-[13px] font-semibold text-red-500 hover:text-red-400 transition-colors">
                View All Bookings
              </Link>
            </div>
          )}
        </div>

        {/* Popular Shows/Movies Column */}
        <div className="bg-[#0f172a] border border-slate-800/50 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-800/50 flex items-center gap-2 shrink-0">
            <Star size={16} className="text-amber-500" />
            <h2 className="text-[15px] font-semibold text-slate-100">
              Top Performing Shows
            </h2>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            {popularShows.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-32 h-24 mb-6 bg-[#09090b] rounded-xl flex flex-col items-center justify-center border border-slate-800/50">
                   <BarChart2 size={32} className="text-indigo-200 mb-2" />
                   <div className="w-16 h-1.5 bg-indigo-100 rounded-full"></div>
                </div>
                <h3 className="text-white font-bold mb-1.5">No show data available yet.</h3>
                <p className="text-[13px] text-slate-500 max-w-[200px] leading-relaxed">
                  Show performance analytics will appear here once shows are created.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {popularShows.map((show, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#09090b] flex items-center justify-center text-slate-300 font-bold text-[13px] border border-slate-800/50 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[14px] font-bold text-white truncate" title={show.movieTitle}>
                        {show.movieTitle}
                      </p>
                      <div className="flex items-center gap-2 text-[12px] text-slate-500 mt-1 font-medium">
                        <span className="truncate max-w-[100px]">{show.theatre}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-600">{show.occupancyPct}% full</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pt-0.5">
                      <p className="text-[14px] font-bold text-white">₹{show.totalRevenue?.toLocaleString('en-IN')}</p>
                      <p className="text-[12px] text-slate-400 font-medium mt-1">{show.totalBookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800/50">
             <Link to="/admin/analytics" className="w-full flex items-center justify-center py-2 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-300 font-medium text-[13px] hover:bg-slate-800 transition-colors">
                View Full Analytics
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

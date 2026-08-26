import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, Ticket, Search, Filter } from 'lucide-react';
import Loading from '../../components/Loading';
import { toast } from 'react-hot-toast';

export default function ViewBookings() {
  const { apiClient } = useApp();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      
      const response = await apiClient.get('/api/booking/admin-bookings', { params });
      if (response.data.success) {
        setBookings(response.data.data);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-800 text-slate-200 border-slate-800/50';
    }
  };

  // Local filter for search (if backend doesn't support text search yet)
  const filteredBookings = bookings.filter(b => 
    b.movieTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0f172a] p-6 rounded-xl shadow-sm border border-slate-800/50">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="text-red-500" /> All Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage all customer bookings</p>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-xl shadow-sm border border-slate-800/50 p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by movie or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800/50 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {['', 'confirmed', 'pending', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors text-sm whitespace-nowrap flex items-center gap-2 ${
                statusFilter === status
                  ? 'bg-red-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {status === '' && <Filter size={14} />}
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Status'}
            </button>
          ))}
        </div>
      </div>

      {loading && bookings.length === 0 ? (
        <div className="text-center py-12 text-red-500">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-[#0f172a] p-12 text-center rounded-xl shadow-sm border border-slate-800/50">
          <Ticket size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No bookings found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="bg-[#0f172a] rounded-xl shadow-sm border border-slate-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#09090b] text-slate-500 font-semibold border-b border-slate-800/50 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Booking ID & User</th>
                  <th className="px-6 py-4">Movie</th>
                  <th className="px-6 py-4">Show Details</th>
                  <th className="px-6 py-4">Seats & Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-[#09090b] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-red-500 mb-1">
                        #{booking._id.slice(-6).toUpperCase()}
                      </div>
                      <div className="text-slate-400 text-xs truncate max-w-[150px]" title={booking.userId}>
                        {booking.userId}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white line-clamp-2 max-w-[200px]">
                      {booking.movieTitle || booking.showId?.movieId?.title || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-white font-medium">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(booking.showDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                        <Clock size={14} className="text-slate-400" />
                        {booking.showTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-1 rounded inline-block mb-1">
                        {booking.seats.join(', ')} ({booking.seats.length} seats)
                      </div>
                      <div className="text-white font-bold">₹{booking.amount?.toFixed(2) || '0.00'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-semibold text-xs border ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-[#09090b] border-t border-slate-800/50">
              <span className="text-sm text-slate-400 font-medium">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[#0f172a] border border-slate-800/50 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-slate-800 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-[#0f172a] border border-slate-800/50 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-slate-800 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { Trash2, Calendar, Clock, MonitorPlay, Search, MapPin } from 'lucide-react';

export default function ListShows() {
  const { apiClient } = useApp();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchShows();
  }, [page, searchTerm]);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const params = { page };
      // Note: The backend /api/show/list doesn't support text search currently, 
      // but we will implement local filtering or add it later.
      // For now, we'll fetch normally.
      const response = await apiClient.get('/api/show/list', { params });
      if (response.data.success) {
        setShows(response.data.data);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
      toast.error('Error loading shows');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Are you sure you want to delete this show? This cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/show/${showId}`);
      if (response.data.success) {
        toast.success('Show deleted successfully');
        fetchShows();
      } else {
        toast.error(response.data.message || 'Error deleting show');
      }
    } catch (error) {
      console.error('Error deleting show:', error);
      toast.error(error.response?.data?.message || 'Cannot delete show if it has confirmed bookings.');
    }
  };

  // Local filter for search (if backend doesn't support it)
  const filteredShows = shows.filter(show => 
    show.movieTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.theatre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MonitorPlay className="text-indigo-600" /> Manage Shows
          </h1>
          <p className="text-sm text-slate-500 mt-1">View and manage scheduled movie shows</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search shows by movie or cinema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          />
        </div>
      </div>

      {loading && shows.length === 0 ? (
        <div className="text-center py-12 text-indigo-600">Loading...</div>
      ) : filteredShows.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-200">
          <MonitorPlay size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 text-lg font-medium">No shows found</p>
          <p className="text-slate-500 text-sm mt-1">Schedule new shows using the Add Show page.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Movie</th>
                  <th className="px-6 py-4">Cinema & Screen</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-center">Available Seats</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShows.map((show) => (
                  <tr key={show._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-slate-100 rounded-md overflow-hidden shrink-0">
                          {show.movieId?.poster_path ? (
                            <img src={`https://image.tmdb.org/t/p/w92${show.movieId.poster_path}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Img</div>
                          )}
                        </div>
                        <span className="font-semibold text-slate-900 line-clamp-2">
                          {show.movieTitle || show.movieId?.title || 'Unknown Movie'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-medium flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {show.theatre}
                      </div>
                      <div className="text-slate-500 text-xs mt-1 ml-5">
                        {show.screen} ({show.screenType})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(show.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                        <Clock size={14} className="text-slate-400" />
                        {show.time} - {show.endTime || '?'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 whitespace-nowrap">
                      ₹{show.price}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {(() => {
                        const available = Math.max(0, show.totalSeats - (show.occupiedSeats?.length || 0) - (show.lockedSeats?.length || 0));
                        const pct = (available / show.totalSeats) * 100;
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-block ${
                              pct < 10 ? 'bg-red-100 text-red-700' :
                              pct < 50 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {available} / {show.totalSeats}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteShow(show._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete Show"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
              <span className="text-sm text-slate-600 font-medium">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-slate-100 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-slate-100 transition"
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

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { Trash2, Calendar, Clock } from 'lucide-react';

export default function ListShows() {
  const { apiClient } = useApp();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/show/list?page=1');
      if (response.data.success) {
        setShows(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
      toast.error('Error loading shows');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Are you sure you want to delete this show?')) {
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
      toast.error('Error deleting show');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">Manage Shows</h1>

      {loading ? (
        <div className="text-center py-8 md:py-12">Loading...</div>
      ) : shows.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-base md:text-lg">No shows found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden min-w-max md:min-w-0">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-gray-700 text-xs md:text-sm lg:text-base">Movie</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-gray-700 text-xs md:text-sm lg:text-base">Date</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-gray-700 text-xs md:text-sm lg:text-base">Time</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-gray-700 text-xs md:text-sm lg:text-base">Price</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-gray-700 text-xs md:text-sm lg:text-base">Available</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-center font-semibold text-gray-700 text-xs md:text-sm lg:text-base">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shows.map((show) => (
                <tr key={show._id} className="border-b hover:bg-gray-50 text-xs md:text-sm lg:text-base">
                  <td className="px-3 md:px-6 py-3 md:py-4 truncate">{show.movieId?.title || 'Unknown'}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Calendar size={14} className="md:hidden" />
                      <Calendar size={16} className="hidden md:block" />
                      <span className="truncate">{new Date(show.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Clock size={14} className="md:hidden" />
                      <Clock size={16} className="hidden md:block" />
                      {show.time}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 font-semibold whitespace-nowrap">₹{show.price}</td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <span className="bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold inline-block">
                      {show.totalSeats - (show.occupiedSeats?.length || 0)}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                    <button
                      onClick={() => handleDeleteShow(show._id)}
                      className="text-red-600 hover:text-red-800 transition-colors inline-flex"
                    >
                      <Trash2 size={16} className="md:hidden" />
                      <Trash2 size={20} className="hidden md:block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

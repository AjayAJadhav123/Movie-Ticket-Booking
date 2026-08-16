import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, Ticket } from 'lucide-react';
import Loading from '../../components/Loading';

export default function ViewBookings() {
  const { apiClient } = useApp();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await apiClient.get('/api/booking/admin-bookings', { params });
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">All Bookings</h1>

      <div className="mb-6 flex gap-2 flex-wrap">
        {['', 'confirmed', 'pending', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors text-xs md:text-sm ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-base md:text-lg">No bookings found.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 lg:gap-6">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <div className="lg:col-span-1">
                  <p className="text-gray-600 mb-1 font-semibold text-xs md:text-sm">Movie</p>
                  <p className="font-semibold text-sm md:text-lg truncate">{booking.movieTitle}</p>
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <p className="text-gray-600 mb-1 font-semibold text-xs md:text-sm">User</p>
                  <p className="font-semibold text-xs md:text-sm truncate text-gray-800">{booking.userId}</p>
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <p className="text-gray-600 mb-1 font-semibold text-xs md:text-sm">Show Details</p>
                  <div className="text-xs md:text-sm space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="flex-shrink-0" />
                      <span className="truncate">{new Date(booking.showDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="flex-shrink-0" />
                      {booking.showTime}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <p className="text-gray-600 mb-1 font-semibold text-xs md:text-sm">Seats & Amount</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {booking.seats.slice(0, 2).map((seat) => (
                      <span
                        key={seat}
                        className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-semibold"
                      >
                        {seat}
                      </span>
                    ))}
                    {booking.seats.length > 2 && (
                      <span className="text-xs text-gray-500 flex items-center">
                        +{booking.seats.length - 2}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-indigo-600 text-sm md:text-base">₹{booking.amount.toFixed(2)}</p>
                </div>

                <div className="md:col-span-2 lg:col-span-1 flex items-end">
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-semibold text-xs md:text-sm w-full md:w-auto text-center lg:text-center ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

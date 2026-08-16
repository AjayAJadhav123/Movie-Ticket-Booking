import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { Calendar, Clock, Ticket, FileCheck, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function MyBookings() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bookings, fetchUserBookings, loading, apiClient } = useApp();
  const [displayBookings, setDisplayBookings] = useState([]);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      fetchUserBookings();
      
      // Check if returning from payment
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        verifyPaymentFromSession(sessionId);
      }
    }
  }, [isSignedIn, searchParams]);

  const verifyPaymentFromSession = async (sessionId) => {
    try {
      setVerifyingPayment(true);
      
      // Find the booking that corresponds to this session
      // We'll do this by checking all pending bookings
      const pendingBookings = bookings.filter(b => b.status === 'pending');
      
      for (const booking of pendingBookings) {
        if (booking.stripeSessionId === sessionId) {
          // Verify this payment
          const response = await apiClient.get('/api/booking/verify-payment-session', {
            params: {
              sessionId: sessionId,
              bookingId: booking._id
            }
          });
          
          if (response.data.success) {
            if (response.data.data.status === 'paid') {
              toast.success('✅ Payment confirmed! Your booking is confirmed.');
              // Refresh bookings to show updated status
              setTimeout(() => fetchUserBookings(), 500);
            } else if (response.data.data.status === 'unpaid') {
              toast.info('Payment is still processing. Please check back in a moment.');
              // Auto-refresh after 3 seconds
              setTimeout(() => fetchUserBookings(), 3000);
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      // Don't show error - payment might still go through via webhook
      toast.info('Verifying your payment...');
    } finally {
      setVerifyingPayment(false);
    }
  };

  useEffect(() => {
    setDisplayBookings(bookings);
  }, [bookings]);

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-gray-600 mb-4">Please sign in to view your bookings.</p>
      </div>
    );
  }

  if (loading || verifyingPayment) {
    return <Loading />;
  }

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Bookings</h1>

      {displayBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <FileCheck size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No bookings yet.</p>
          <p className="text-gray-400">Book your first movie ticket to see it here!</p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {displayBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {booking.status === 'pending' && (
                <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-start gap-3">
                  <AlertCircle size={18} className="text-yellow-700 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold">Payment Pending</p>
                    <p>Your payment is being processed. Please wait or check back shortly.</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 p-4 md:p-6">
                {/* Movie Info */}
                <div className="md:col-span-2 lg:col-span-2">
                  <h3 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">{booking.movieTitle}</h3>
                  <div className="space-y-1 md:space-y-2 text-sm md:text-base">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={16} />
                      <span>{new Date(booking.showDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} />
                      <span>{booking.showTime}</span>
                    </div>
                  </div>
                </div>

                {/* Seats */}
                <div className="lg:col-span-1">
                  <p className="text-gray-600 mb-2 font-semibold text-sm md:text-base">Seats</p>
                  <div className="flex flex-wrap gap-1 md:gap-2 mb-3 md:mb-4">
                    {booking.seats.map((seat) => (
                      <span
                        key={seat}
                        className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-semibold text-xs md:text-sm"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-1 md:mb-2 font-semibold text-sm md:text-base">Amount</p>
                  <p className="text-xl md:text-2xl font-bold text-indigo-600">
                    ₹{booking.amount.toFixed(2)}
                  </p>
                </div>

                {/* Status */}
                <div className="lg:col-span-1">
                  <p className="text-gray-600 mb-2 font-semibold text-sm md:text-base">Status</p>
                  <span
                    className={`inline-block px-3 md:px-4 py-2 rounded-full font-semibold text-xs md:text-sm ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                {/* View Ticket Button */}
                <div className="lg:col-span-1 flex items-end">
                  <button
                    onClick={() => navigate(`/booking/${booking._id}`)}
                    className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-xs md:text-sm"
                  >
                    <Eye size={16} />
                    View Ticket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

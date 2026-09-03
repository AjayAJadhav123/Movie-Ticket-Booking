import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { Calendar, Clock, Ticket, FileCheck, Eye, AlertCircle, Download } from 'lucide-react';
import { toast } from 'react-toastify';

export default function MyBookings() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bookings, fetchUserBookings, loading, apiClient } = useApp();
  const [displayBookings, setDisplayBookings] = useState([]);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

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
              setTimeout(() => fetchUserBookings(), 500);
            } else if (response.data.data.status === 'unpaid') {
              toast.info('Payment is still processing. Please check back in a moment.');
              setTimeout(() => fetchUserBookings(), 3000);
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.info('Verifying your payment...');
    } finally {
      setVerifyingPayment(false);
    }
  };

  useEffect(() => {
    let filtered = bookings;
    if (filterStatus !== 'all') {
      filtered = bookings.filter(b => b.status === filterStatus);
    }
    setDisplayBookings(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, [bookings, filterStatus]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-[#141414] flex items-center justify-center">
        <div className="text-center">
          <Ticket size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-lg text-slate-400 mb-4">Please sign in to view your bookings.</p>
          <button
            onClick={() => navigate('/sign-in')}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading || verifyingPayment) {
    return <Loading />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border border-amber-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'failed':
        return 'bg-red-100 text-red-700 border border-red-300';
      default:
        return 'bg-slate-700 text-slate-300 border border-slate-700';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-500';
      default:
        return 'bg-red-600/20 text-red-400';
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-16 bg-[#141414]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">My Bookings</h1>
          <p className="text-slate-400 text-base md:text-lg">View and manage your movie ticket bookings</p>
        </div>

        {/* Filter Tabs */}
        {bookings.length > 0 && (
          <div className="flex gap-2 mb-8 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'pending', label: 'Pending' },
              { value: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  filterStatus === tab.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Bookings */}
        {displayBookings.length === 0 ? (
          <div className="text-center py-16 md:py-24 card card-hover">
            <FileCheck size={56} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-400 text-lg md:text-xl mb-4">No bookings yet.</p>
            <p className="text-slate-500 mb-8">Book your first movie ticket to get started!</p>
            <button
              onClick={() => navigate('/movies')}
              className="btn-primary"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {displayBookings.map((booking) => (
              <div
                key={booking._id}
                className="card card-hover overflow-hidden"
              >
                {/* Pending Alert */}
                {booking.status === 'pending' && (
                  <div className="bg-amber-50 border-b border-amber-300 p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-semibold">Payment Pending</p>
                      <p className="text-amber-600">Your payment is being processed. Please check back shortly.</p>
                    </div>
                  </div>
                )}

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 p-4 md:p-6">
                  {/* Movie Info with Poster */}
                  <div className="md:col-span-2 lg:col-span-2 flex gap-4">
                    {booking.showId?.movieId?.poster_path && (
                      <div className="hidden md:block flex-shrink-0 w-20 h-32 rounded-lg overflow-hidden">
                        <img
                          src={`https://image.tmdb.org/t/p/w200${booking.showId.movieId.poster_path}`}
                          alt={booking.movieTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white mb-4">{booking.movieTitle}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar size={16} className="text-primary" />
                          <span className="text-sm md:text-base">{new Date(booking.showDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock size={16} className="text-primary" />
                          <span className="text-sm md:text-base">{booking.showTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seats */}
                  <div className="lg:col-span-1">
                    <p className="text-slate-400 mb-2 font-semibold text-xs uppercase tracking-wide">Seats</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {booking.seats.map((seat) => (
                        <span
                          key={seat}
                          className="bg-indigo-100 text-primary px-2 py-1 rounded font-semibold text-xs border border-indigo-300"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-400 mb-2 font-semibold text-xs uppercase tracking-wide">Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{booking.amount.toFixed(2)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-1">
                    <p className="text-slate-400 mb-2 font-semibold text-xs uppercase tracking-wide">Status</p>
                    <span className={`inline-block px-3 py-2 rounded-lg font-semibold text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-1 flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/booking/${booking._id}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-red-700 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-indigo-500/30 font-semibold text-sm"
                    >
                      <Eye size={16} />
                      View Ticket
                    </button>
                    <button
                      onClick={() => {
                        const ticketContent = `
=========================================
          QUICKSHOW TICKET
=========================================
Movie: ${booking.movieTitle}
Date: ${new Date(booking.showDate).toLocaleDateString()}
Time: ${booking.showTime}
Seats: ${booking.seats.join(', ')}
Amount Paid: Rs. ${booking.amount.toFixed(2)}
Status: ${booking.status.toUpperCase()}
Booking ID: ${booking._id}
=========================================
Thank you for booking with QuickShow!
`.trim();
                        const blob = new Blob([ticketContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Ticket_${booking.movieTitle.replace(/\\s+/g, '_')}_${booking._id.substring(0, 8)}.txt`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        toast.success('Ticket downloaded successfully!');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-all font-semibold text-sm"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import Loading from '../components/Loading';
import { Download, Printer, ArrowLeft, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'react-toastify';

export default function BookingTicket() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { apiClient } = useApp();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const ticketRef = useRef(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchBooking();
    }
  }, [bookingId, isSignedIn]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/booking/${bookingId}`);
      if (response.data.success) {
        setBooking(response.data.data);
        generateQRCode(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view this booking.');
      } else if (err.response?.status === 404) {
        setError('Booking not found.');
      } else {
        setError(err.response?.data?.message || 'Error loading booking');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (bookingData) => {
    try {
      // QR data contains booking verification info (no secrets)
      const qrData = JSON.stringify({
        bookingId: bookingData._id,
        movieTitle: bookingData.movieTitle,
        showDate: bookingData.showDate,
        showTime: bookingData.showTime,
        seats: bookingData.seats.join(','),
      });

      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCode(qrUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (ticketRef.current) {
      printWindow.document.write(ticketRef.current.innerHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = async () => {
    try {
      const element = ticketRef.current;
      const canvas = await html2canvas(element);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `QuickShow-Ticket-${booking._id}.png`;
      link.click();
      toast.success('Ticket downloaded successfully');
    } catch (err) {
      console.error('Error downloading ticket:', err);
      toast.error('Error downloading ticket');
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-gray-600 mb-4">Please sign in to view your booking ticket.</p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <button
          onClick={() => navigate('/my-bookings')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-semibold"
        >
          <ArrowLeft size={20} />
          Back to Bookings
        </button>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-gray-600">Booking not found.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-800' };
      case 'pending':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800' };
      case 'cancelled':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-800' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusColor = getStatusColor(booking.status);
  const moviePoster = booking.showId?.movieId?.poster_path
    ? `https://image.tmdb.org/t/p/w500${booking.showId.movieId.poster_path}`
    : '/placeholder-movie.jpg';

  const formattedDate = new Date(booking.showDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedBookingDate = new Date(booking.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/my-bookings')}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-semibold"
      >
        <ArrowLeft size={20} />
        Back to Bookings
      </button>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm md:text-base"
        >
          <Printer size={18} />
          Print Ticket
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm md:text-base"
        >
          <Download size={18} />
          Download
        </button>
      </div>

      {/* Ticket */}
      <div
        ref={ticketRef}
        className={`max-w-2xl mx-auto ${statusColor.bg} ${statusColor.border} border-4 rounded-2xl overflow-hidden shadow-2xl`}
      >
        {/* Header with Branding */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">🎬 QuickShow</h1>
              <p className="text-indigo-100 mt-1 text-sm md:text-base">Movie Ticket Confirmation</p>
            </div>
            <div className="text-right">
              <span className={`inline-block ${statusColor.badge} px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm`}>
                {booking.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-8">
          {/* Movie Title */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{booking.movieTitle}</h2>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
            {/* Movie Poster */}
            <div className="col-span-1 flex justify-center">
              <img
                src={moviePoster}
                alt={booking.movieTitle}
                className="h-40 md:h-56 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Booking Details */}
            <div className="col-span-1 md:col-span-2">
              <div className="space-y-4 md:space-y-6">
                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <p className="text-gray-600 font-semibold mb-1 text-sm md:text-base">📅 SHOW DATE</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-800">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold mb-1 text-sm md:text-base">🕐 SHOW TIME</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-800">{booking.showTime}</p>
                  </div>
                </div>

                {/* Seats */}
                <div>
                  <p className="text-gray-600 font-semibold mb-2 text-sm md:text-base">🎫 YOUR SEATS</p>
                  <div className="flex flex-wrap gap-2">
                    {booking.seats.map((seat) => (
                      <span
                        key={seat}
                        className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg font-bold text-sm md:text-lg"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price Details */}
                <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
                  <div className="flex justify-between mb-2 text-sm md:text-base">
                    <span className="text-gray-700">Tickets ({booking.seats.length})</span>
                    <span className="font-semibold">₹{booking.amount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold md:text-lg text-base">
                    <span>Total</span>
                    <span className="text-indigo-600">₹{booking.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code and Booking Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8 pt-4 md:pt-8 border-t border-gray-300">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <p className="text-gray-600 font-semibold mb-3 text-sm md:text-base">Ticket Verification</p>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="Booking QR Code"
                  className="w-40 h-40 md:w-48 md:h-48 border-2 border-gray-300 p-2 rounded-lg bg-white"
                />
              )}
              <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">Scan to verify</p>
            </div>

            {/* Booking ID and Dates */}
            <div className="flex flex-col justify-center">
              <div className="space-y-3 md:space-y-4">
                <div>
                  <p className="text-gray-600 font-semibold mb-1 text-sm md:text-base">Booking ID</p>
                  <p className="text-xs md:text-sm font-mono bg-gray-100 p-2 md:p-3 rounded text-gray-800 break-all">
                    {booking._id}
                  </p>
                </div>

                {booking.paymentId && (
                  <div>
                    <p className="text-gray-600 font-semibold mb-1 text-sm md:text-base">Payment ID</p>
                    <p className="text-xs md:text-sm font-mono bg-gray-100 p-2 md:p-3 rounded text-gray-800 break-all">
                      {booking.paymentId}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-gray-600 font-semibold mb-1 text-sm md:text-base">Booking Date</p>
                  <p className="text-xs md:text-sm text-gray-800">{formattedBookingDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          {booking.status === 'confirmed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 mb-4">
              <p className="text-green-800 text-xs md:text-sm">
                ✓ <strong>Booking Confirmed!</strong> Please arrive at least 15 minutes before the show starts.
              </p>
            </div>
          )}

          {booking.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 mb-4">
              <p className="text-yellow-800 text-xs md:text-sm">
                ⏳ <strong>Pending Payment</strong> Complete your payment to confirm your booking.
              </p>
            </div>
          )}

          {booking.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4">
              <p className="text-red-800 text-xs md:text-sm">
                ✗ <strong>Booking Cancelled</strong> This booking has been cancelled.
              </p>
            </div>
          )}

          {/* Bottom Info */}
          <div className="text-center pt-4 md:pt-6 border-t border-gray-300 mt-4 md:mt-6">
            <p className="text-gray-600 mb-1 text-sm md:text-base">Thank you for booking with QuickShow!</p>
            <p className="text-xs md:text-sm text-gray-500">Enjoy your movie! 🍿</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background-color: white;
          }
          .no-print {
            display: none !important;
          }
          .ticket-container {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

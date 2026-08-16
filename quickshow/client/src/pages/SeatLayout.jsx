import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { loadStripe } from '@stripe/stripe-js';
import SeatGrid from '../components/SeatGrid';
import Loading from '../components/Loading';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

export default function SeatLayout() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { selectedSeats, setSelectedSeats, createStripeSession } = useApp();
  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { apiClient } = useApp();

  useEffect(() => {
    fetchShow();
  }, [showId]);

  const fetchShow = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/api/show/${showId}`);
      
      if (response.data.success && response.data.data) {
        const showData = response.data.data;
        setShow(showData);
        
        // Fetch movie details
        if (showData.movieId) {
          await fetchMovie(showData.movieId);
        }
      } else {
        setError('Invalid show data received');
        toast.error('Error loading show details');
      }
    } catch (error) {
      console.error('Error fetching show:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error loading show details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMovie = async (movieId) => {
    try {
      const response = await apiClient.get(`/api/movie/${movieId}`);
      if (response.data.success) {
        setMovie(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching movie:', error);
      setMovie(null);
    }
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    try {
      setIsBooking(true);
      const sessionData = await createStripeSession(showId, selectedSeats);

      if (sessionData?.sessionId) {
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
        if (!stripe) {
          toast.error('Stripe failed to load');
          return;
        }

        await stripe.redirectToCheckout({
          sessionId: sessionData.sessionId,
        });
      } else {
        // Check if it's a Stripe configuration error
        const errorMsg = sessionData?.message || 'Failed to create payment session';
        if (errorMsg.includes('Stripe is not configured')) {
          toast.error('Online payment is currently unavailable. Stripe configuration is required.');
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error during booking:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error processing booking';
      if (errorMsg.includes('Stripe')) {
        toast.error('Online payment is currently unavailable. Stripe configuration is required.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !show) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Show</h2>
          <p className="text-red-700 mb-6">{error || 'Show not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = show?.price * selectedSeats.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-semibold"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Seat Grid */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
            {movie?.title} - Select Seats
          </h1>
          <div className="mb-4 text-gray-600 text-sm md:text-base">
            <p>
              <strong>Date:</strong> {new Date(show.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong> {show.time}
            </p>
            <p>
              <strong>Price per seat:</strong> ${show.price}
            </p>
          </div>
          <SeatGrid show={show} onSeatsChange={setSelectedSeats} />
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 lg:sticky lg:top-4">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Booking Summary</h2>

            <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 pb-4 md:pb-6 border-b">
              <div>
                <p className="text-gray-600 mb-1 md:mb-2 text-sm md:text-base">Movie</p>
                <p className="font-semibold text-sm md:text-base">{movie?.title}</p>
              </div>

              <div>
                <p className="text-gray-600 mb-1 md:mb-2 text-sm md:text-base">Date</p>
                <p className="font-semibold text-sm md:text-base">
                  {new Date(show.date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-gray-600 mb-1 md:mb-2 text-sm md:text-base">Time</p>
                <p className="font-semibold text-sm md:text-base">{show.time}</p>
              </div>

              <div>
                <p className="text-gray-600 mb-2 text-sm md:text-base">Selected Seats</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat}
                      className="bg-pink-100 text-pink-800 px-2 md:px-3 py-1 rounded font-semibold text-xs md:text-sm"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
                {selectedSeats.length === 0 && (
                  <p className="text-gray-400 text-xs md:text-sm">No seats selected</p>
                )}
              </div>
            </div>

            <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600">Subtotal ({selectedSeats.length} seats)</span>
                <span className="font-semibold">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600">Taxes & Fees</span>
                <span className="font-semibold">${(totalPrice * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 md:pt-3 flex justify-between md:text-lg">
                <span className="font-bold text-sm md:text-base">Total</span>
                <span className="text-indigo-600 font-bold text-sm md:text-base">
                  ${(totalPrice * 1.1).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={selectedSeats.length === 0 || isBooking}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {isBooking ? (
                <>
                  <Spinner size="sm" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>

            <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4 text-center">
              Seats will be held for 10 minutes during payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

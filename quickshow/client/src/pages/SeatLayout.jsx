import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import SeatGrid from '../components/SeatGrid';
import Loading from '../components/Loading';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

// Cashfree script handler
const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/ui.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SeatLayout() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useAuth();
  const { selectedSeats, setSelectedSeats } = useApp();
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
    console.log("Payment attempt - Clerk status:", {
      clerkLoaded,
      isSignedIn,
      selectedSeats: selectedSeats.length
    });

    if (!clerkLoaded) {
      toast.error('Clerk is still loading. Please wait.');
      return;
    }

    if (!isSignedIn) {
      toast.error('You must be signed in to book tickets');
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    try {
      setIsBooking(true);
      const token = await getToken();

      // Create Cashfree order on backend
      const response = await apiClient.post(
        '/api/booking/create-cashfree-order',
        {
          showId,
          seats: selectedSeats,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const { orderId, bookingId, amount, paymentSessionId } = response.data.data;
        
        // Load Cashfree script
        const scriptLoaded = await loadCashfreeScript();
        if (!scriptLoaded) {
          toast.error('Failed to load payment gateway');
          setIsBooking(false);
          return;
        }

        console.log('✅ Cashfree order created:', {
          orderId,
          bookingId,
          amount,
          paymentSessionId
        });

        // Initialize Cashfree and open checkout
        if (window.Cashfree && paymentSessionId) {
          const checkoutOptions = {
            paymentSessionId: paymentSessionId,
            redirectTarget: '_self',
          };

          try {
            window.Cashfree.checkout(checkoutOptions).then((checkoutInstance) => {
              if (checkoutInstance) {
                checkoutInstance.open();
              } else {
                toast.error('Failed to initialize payment checkout');
                setIsBooking(false);
              }
            }).catch((error) => {
              console.error('Cashfree checkout error:', error);
              toast.error('Failed to open payment checkout');
              setIsBooking(false);
            });
          } catch (error) {
            console.error('Cashfree initialization error:', error);
            toast.error('Payment gateway initialization failed');
            setIsBooking(false);
          }
        } else if (!paymentSessionId) {
          toast.error('Payment session not created. Please try again.');
          console.error('Missing paymentSessionId:', { paymentSessionId, response: response.data.data });
          setIsBooking(false);
        } else {
          toast.error('Cashfree SDK not loaded properly');
          setIsBooking(false);
        }
      } else {
        toast.error(response.data.message || 'Failed to create payment order');
        setIsBooking(false);
      }
    } catch (error) {
      console.error('Error during booking:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error processing booking';
      toast.error(errorMsg);
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !show) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-white flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Show</h2>
          <p className="text-slate-700 mb-6">{error || 'Show not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary w-full"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = show?.price * selectedSeats.length;

  return (
    <>
      <div className="min-h-screen pt-20 pb-16 bg-white">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Seat Grid */}
            <div className="lg:col-span-2">
              <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-slate-900">
                {movie?.title} - Select Seats
              </h1>
              <div className="mb-4 text-slate-600 text-sm md:text-base space-y-2">
                <p>
                  <span className="text-slate-700 font-semibold">Date:</span> {new Date(show.date).toLocaleDateString()}
                </p>
                <p>
                  <span className="text-slate-700 font-semibold">Time:</span> {show.time}
                </p>
                <p>
                  <span className="text-slate-700 font-semibold">Price per seat:</span> ₹{show.price}
                </p>
              </div>
              <SeatGrid show={show} onSeatsChange={setSelectedSeats} />
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="card p-4 md:p-6 lg:sticky lg:top-24">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-slate-900">Booking Summary</h2>

                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-slate-200">
                  <div>
                    <p className="text-slate-600 mb-1 md:mb-2 text-sm md:text-base">Movie</p>
                    <p className="font-semibold text-slate-900 text-sm md:text-base">{movie?.title}</p>
                  </div>

                  <div>
                    <p className="text-slate-600 mb-1 md:mb-2 text-sm md:text-base">Date</p>
                    <p className="font-semibold text-slate-900 text-sm md:text-base">
                      {new Date(show.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-600 mb-1 md:mb-2 text-sm md:text-base">Time</p>
                    <p className="font-semibold text-slate-900 text-sm md:text-base">{show.time}</p>
                  </div>

                  <div>
                    <p className="text-slate-600 mb-2 text-sm md:text-base">Selected Seats</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seat) => (
                        <span
                          key={seat}
                          className="bg-indigo-100 text-indigo-600 px-2 md:px-3 py-1 rounded font-semibold text-xs md:text-sm border border-indigo-300"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                    {selectedSeats.length === 0 && (
                      <p className="text-slate-500 text-xs md:text-sm">No seats selected</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-slate-600">Subtotal ({selectedSeats.length} seats)</span>
                    <span className="font-semibold text-slate-900">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-slate-600">Taxes & Fees (10%)</span>
                    <span className="font-semibold text-slate-900">₹{(totalPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 md:pt-3 flex justify-between">
                    <span className="font-bold text-slate-900 text-sm md:text-base">Total</span>
                    <span className="text-indigo-600 font-bold text-sm md:text-base">
                      ₹{(totalPrice * 1.1).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={selectedSeats.length === 0 || isBooking}
                  className="w-full btn-primary py-2 md:py-3 flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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

                <p className="text-xs md:text-sm text-slate-600 mt-3 md:mt-4 text-center">
                  Seats will be held for 10 minutes during payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


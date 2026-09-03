import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useSocketIO } from '../hooks/useSocketIO';
import SeatGrid from '../components/SeatGrid';
import DynamicPricingDisplay from '../components/DynamicPricingDisplay';
import Loading from '../components/Loading';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

// Polyfill PaymentInterface for Firefox compatibility (Cashfree SDK requires it)
if (typeof window !== 'undefined' && !window.PaymentInterface) {
  window.PaymentInterface = class PaymentInterface {};
}

// Cashfree script handler
const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    // Check if it's already loaded
    if (window.Cashfree) {
      resolve(true);
      return;
    }
    // Apply polyfill before SDK loads
    if (!window.PaymentInterface) {
      window.PaymentInterface = class PaymentInterface {};
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SeatLayout() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, token } = useAuth();
  const { selectedSeats, setSelectedSeats } = useApp();
  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dynamicPrice, setDynamicPrice] = useState(null);
  const { apiClient } = useApp();

  // Socket.IO connection for real-time seat availability
  const { isConnected, lockedSeats, occupiedSeats } = useSocketIO(showId);

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

    if (!isLoaded) {
      toast.error('Auth is still loading. Please wait.');
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
      // token is already available from useAuth

      // Create Cashfree order on backend
      const response = await apiClient.post(
        '/api/booking/create-cashfree-order',
        {
          showId,
          seats: selectedSeats,
        }
      );

      if (response.data.success) {
        const { orderId, bookingId, amount, paymentSessionId, environment } = response.data.data;
        
        // Load Cashfree script
        const scriptLoaded = await loadCashfreeScript();
        if (!scriptLoaded) {
          toast.error('Failed to load payment gateway');
          setIsBooking(false);
          return;
        }


        // Initialize Cashfree and open checkout
        if (window.Cashfree && paymentSessionId) {
          try {
            // Ensure polyfill is in place before SDK init
            if (!window.PaymentInterface) {
              window.PaymentInterface = class PaymentInterface {};
            }

            const cashfreeMode = environment || 'sandbox';
            const cashfree = window.Cashfree({ mode: cashfreeMode });
            
            const checkoutOptions = {
              paymentSessionId: paymentSessionId,
              redirectTarget: '_self',
            };
            
            const result = await cashfree.checkout(checkoutOptions);
            if (result && result.error) {
              console.error('Cashfree checkout error:', result.error);
              // Domain not whitelisted in Cashfree dashboard
              if (result.error.message && result.error.message.includes('not enabled')) {
                toast.error('This domain is not whitelisted in Cashfree. Please whitelist localhost:5173 in your Cashfree merchant dashboard → Developers → App Credentials.');
              } else {
                toast.error(result.error.message || 'Failed to complete payment');
              }
              setIsBooking(false);
            }
          } catch (error) {
            console.error('Cashfree initialization error:', error);
            if (error.message && error.message.includes('PaymentInterface')) {
              toast.error('Browser compatibility issue with payment SDK. Please try in Chrome.');
            } else {
              toast.error('Payment gateway initialization failed. Please try again.');
            }
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
      <div className="min-h-screen pt-20 pb-16 bg-[#141414] flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Show</h2>
          <p className="text-slate-300 mb-6">{error || 'Show not found'}</p>
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

  const totalPrice = dynamicPrice ? (dynamicPrice * selectedSeats.length) : (show?.price * selectedSeats.length);

  return (
    <>
      <div className="min-h-screen pt-8 pb-16 bg-[#141414]">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-red-400 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Seat Grid */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight min-w-0 flex-1">
                  <span className="block truncate">{movie?.title}</span>
                  <span className="text-base sm:text-lg md:text-xl text-slate-400 font-semibold">Select Seats</span>
                </h1>
                {/* Socket.IO Connection Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs font-medium text-slate-300">
                    {isConnected ? 'Live' : 'Connecting...'}
                  </span>
                </div>
              </div>
              <div className="mb-4 text-slate-400 text-sm md:text-base space-y-2">
                <p>
                  <span className="text-slate-300 font-semibold">Theatre:</span> {show.theatre || 'Theatre TBD'}
                </p>
                <p>
                  <span className="text-slate-300 font-semibold">Screen:</span> {show.screen || 'Screen TBD'}
                </p>
                <p>
                  <span className="text-slate-300 font-semibold">Date:</span> {new Date(show.date).toLocaleDateString()}
                </p>
                <p>
                  <span className="text-slate-300 font-semibold">Time:</span> {show.time}
                </p>
                <p>
                  <span className="text-slate-300 font-semibold">Price per seat:</span> ₹{show.price}
                </p>
              </div>
              <SeatGrid show={show} onSeatsChange={setSelectedSeats} socketLockedSeats={lockedSeats} socketOccupiedSeats={occupiedSeats} />
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="card p-4 md:p-6 lg:sticky lg:top-24">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-white">Booking Summary</h2>

                {/* Dynamic Pricing Display */}
                <div className="mb-4 md:mb-6">
                  <DynamicPricingDisplay showId={showId} />
                </div>

                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-slate-800">
                  <div>
                    <p className="text-slate-400 mb-1 md:mb-2 text-sm md:text-base">Movie</p>
                    <p className="font-semibold text-white text-sm md:text-base">{movie?.title}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 mb-1 md:mb-2 text-sm md:text-base">Theatre</p>
                    <p className="font-semibold text-white text-sm md:text-base">{show.theatre || 'Theatre TBD'}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 mb-1 md:mb-2 text-sm md:text-base">Screen</p>
                    <p className="font-semibold text-white text-sm md:text-base">{show.screen || 'Screen TBD'}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 mb-1 md:mb-2 text-sm md:text-base">Date</p>
                    <p className="font-semibold text-white text-sm md:text-base">
                      {new Date(show.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 mb-1 md:mb-2 text-sm md:text-base">Time</p>
                    <p className="font-semibold text-white text-sm md:text-base">{show.time}</p>
                  </div>

                  <div>
                    <p className="text-slate-400 mb-2 text-sm md:text-base">Selected Seats</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seat) => (
                        <span
                          key={seat}
                          className="bg-indigo-100 text-primary px-2 md:px-3 py-1 rounded font-semibold text-xs md:text-sm border border-indigo-300"
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
                    <span className="text-slate-400">Subtotal ({selectedSeats.length} seats)</span>
                    <span className="font-semibold text-white">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-slate-400">Taxes & Fees (10%)</span>
                    <span className="font-semibold text-white">₹{(totalPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 md:pt-3 flex justify-between">
                    <span className="font-bold text-white text-sm md:text-base">Total</span>
                    <span className="text-primary font-bold text-sm md:text-base">
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

                <p className="text-xs md:text-sm text-slate-400 mt-3 md:mt-4 text-center">
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


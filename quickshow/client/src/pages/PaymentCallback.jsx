import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient, fetchUserBookings } = useApp();
  const { login } = useAuth();
  const [status, setStatus] = useState('Verifying your payment...');
  const verifyAttempted = useRef(false);

  useEffect(() => {
    // Ensure we don't start multiple polling chains
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    const orderId = searchParams.get('order_id');
    const bookingId = searchParams.get('booking_id');

    if (!orderId || !bookingId) {
      toast.error('Invalid payment callback parameters');
      navigate('/my-bookings', { replace: true });
      return;
    }

    const verifyPayment = async (retryCount = 0) => {
      try {
        if (retryCount > 0) {
          setStatus(`Payment processing... Checking status (Attempt ${retryCount}/10)`);
        }

        const response = await apiClient.post('/api/booking/verify-cashfree-payment', {
          orderId,
          bookingId
        });

        if (response.data.success) {
          const status = response.data.data.status;
          
          if (status === 'confirmed') {
            toast.success('✅ Payment confirmed! Your booking is confirmed.');
            fetchUserBookings(); // Refresh bookings state in background
            
            // Restore user session if the backend generated a fresh token
            if (response.data.data.token && response.data.data.user) {
              login(response.data.data.token, response.data.data.user);
            }
            
            // Redirect to the ticket view page
            navigate(`/booking/${bookingId}`, { replace: true });
            
          } else if (status === 'ACTIVE' || status === 'PENDING') {
            // Payment is still processing on Cashfree's end. Poll again.
            if (retryCount < 10) {
              setTimeout(() => verifyPayment(retryCount + 1), 3000);
            } else {
              toast.info('Payment is taking longer than expected. Please check your bookings later.');
              navigate('/my-bookings', { replace: true });
            }
          } else {
            toast.error('Payment failed or was cancelled.');
            navigate('/my-bookings', { replace: true });
          }
        } else {
          toast.error(response.data.message || 'Payment verification failed');
          navigate('/my-bookings', { replace: true });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        
        // If it's a network error during polling, we can still retry
        if (retryCount < 10) {
          setTimeout(() => verifyPayment(retryCount + 1), 3000);
        } else {
          toast.error('Error verifying payment. Please check your bookings.');
          navigate('/my-bookings', { replace: true });
        }
      }
    };

    verifyPayment();
  }, [searchParams, navigate, apiClient, fetchUserBookings, login]);

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#141414] flex flex-col items-center justify-center text-center px-4">
      <Loader2 size={48} className="animate-spin text-indigo-500 mb-6" />
      <h2 className="text-2xl font-bold text-white mb-3">{status}</h2>
      <p className="text-slate-400 max-w-md">
        Please do not refresh or close this page. We are securely verifying your transaction with the payment provider.
      </p>
    </div>
  );
}

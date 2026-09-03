import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient, fetchUserBookings } = useApp();
  const [status, setStatus] = useState('Verifying your payment...');

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const bookingId = searchParams.get('booking_id');

    if (!orderId || !bookingId) {
      toast.error('Invalid payment callback parameters');
      navigate('/my-bookings', { replace: true });
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await apiClient.post('/api/booking/verify-cashfree-payment', {
          orderId,
          bookingId
        });

        if (response.data.success) {
          if (response.data.data.status === 'confirmed') {
            toast.success('✅ Payment confirmed! Your booking is confirmed.');
            fetchUserBookings(); // Refresh bookings state in background
            // Redirect to the ticket view page
            navigate(`/booking/${bookingId}`, { replace: true });
          } else {
            toast.info('Payment is still processing or failed. Please check your bookings later.');
            navigate('/my-bookings', { replace: true });
          }
        } else {
          toast.error(response.data.message || 'Payment verification failed');
          navigate('/my-bookings', { replace: true });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast.error('Error verifying payment. Please check your bookings.');
        navigate('/my-bookings', { replace: true });
      }
    };

    verifyPayment();
  }, [searchParams, navigate, apiClient, fetchUserBookings]);

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#141414] flex flex-col items-center justify-center">
      <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">{status}</h2>
      <p className="text-slate-400">Please do not refresh or close this page.</p>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';

// Always use relative URLs in production so Vercel proxy routes to Render correctly
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL || '';
  if (import.meta.env.PROD && (!envUrl || envUrl.includes('localhost'))) return '';
  return envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
};
const API_BASE = getApiBase();


export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('Email not provided for verification');
      navigate('/sign-up');
    }
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    // Allow pasting full 6 digits
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtp(newOtp);
      // Focus last filled input
      const lastFilledIndex = newOtp.findLastIndex(val => val !== '');
      const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        email,
        otp: otpValue
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Email verified successfully!');
        navigate('/sign-in');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
      // Clear inputs on error for better UX
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/resend-otp`, { email });
      if (response.data.success) {
        toast.success('A new OTP has been sent to your email.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Verify Email</h1>
          <p className="text-slate-400 text-sm md:text-base mt-2">
            We've sent a 6-digit code to <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-slate-800 p-6 md:p-8 shadow-xl">
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-center gap-2 md:gap-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="6"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 md:w-12 md:h-14 bg-[#0a0a0a] border border-slate-700 text-white text-center text-xl md:text-2xl font-bold rounded-lg focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  required
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-primary hover:bg-red-700 text-white font-semibold rounded-lg py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(229,9,20,0.3)] hover:shadow-[0_0_25px_rgba(229,9,20,0.5)]"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            Didn't receive the code?{' '}
            <button 
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:text-red-400 font-medium disabled:opacity-50 transition-colors"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

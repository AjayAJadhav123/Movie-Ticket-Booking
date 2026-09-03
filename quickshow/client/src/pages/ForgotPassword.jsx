import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';

// In production: ALWAYS use relative URLs (empty string)
// Vercel proxy (vercel.json) forwards /api/* to Render.
// An absolute Render URL here bypasses the proxy and causes CORS errors.
const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_BACKEND_URL || '');


export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/forgot-password`, { email });
      if (response.data.success) {
        setSuccess(true);
        toast.success('Password reset email sent');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Reset Password</h1>
          <p className="text-slate-400 text-sm">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-slate-800 p-6 shadow-xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Check your email</h3>
              <p className="text-sm text-slate-500">
                We've sent a password reset link to <span className="font-medium text-white">{email}</span>.
              </p>
              <div className="pt-4">
                <Link to="/sign-in" className="text-primary hover:text-red-400 font-medium text-sm">
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-slate-700 text-white rounded-lg py-2 px-4 focus:border-indigo-500 focus:outline-none transition"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-red-700 text-white font-semibold rounded-lg py-2.5 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
              
              <div className="text-center mt-4">
                <Link to="/sign-in" className="text-slate-500 hover:text-slate-300 font-medium text-sm transition">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

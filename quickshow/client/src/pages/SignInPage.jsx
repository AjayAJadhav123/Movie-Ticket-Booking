import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        login(response.data.token, response.data.user, response.data.user.isAdmin);
        toast.success('Logged in successfully');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };



  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="QuickShow" className="h-12 md:h-16 object-contain" />
          </div>
          <p className="text-slate-400 text-sm md:text-base">Welcome back! Please sign in.</p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-slate-800 p-6 md:p-8 shadow-xl">
          <form onSubmit={handleStandardLogin} className="space-y-4">
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
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-slate-700 text-white rounded-lg py-2 px-4 focus:border-indigo-500 focus:outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:text-red-400 font-medium transition">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-red-700 text-white font-semibold rounded-lg py-2.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>



          <div className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-primary hover:text-red-400 font-medium">
              Sign up
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs md:text-sm">
          By signing in, you agree to our Terms & Conditions and Privacy Policy
        </p>
      </div>
    </AuthLayout>
  );
}

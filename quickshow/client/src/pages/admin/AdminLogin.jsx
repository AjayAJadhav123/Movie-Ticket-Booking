import { Navigate, useNavigate } from 'react-router-dom';
import { Film, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// In production: ALWAYS use relative URLs (empty string)
// Vercel proxy (vercel.json) forwards /api/* to Render.
// An absolute Render URL here bypasses the proxy and causes CORS errors.
const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_BACKEND_URL || '');


export default function AdminLogin() {
  const { login, isLoaded, adminToken } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        if (!response.data.user.isAdmin) {
          toast.error('Access denied. Administrator privileges required.');
          return;
        }

        login(response.data.token, response.data.user, true);
        toast.success('Authentication successful');
        window.location.href = '/admin/dashboard'; // Full reload to ensure state resets
      }
    } catch (err) {
      console.error('Admin login error:', err);
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (adminToken) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-slate-800/50 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium tracking-wide">INITIALIZING WORKSPACE</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#09090b]">
      {/* Cinematic Background */}
      <div 
        className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30" 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
      
      {/* Ambient Red Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Premium Glass Panel */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-xl border border-white/5 shadow-2xl overflow-hidden">
          
          <div className="pt-10 pb-8 px-8 text-center">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="QuickShow Admin" className="h-14 md:h-16 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            </div>
            
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase mb-4">
              <ShieldCheck size={14} />
              Admin Portal
            </div>
            
            <p className="text-sm text-slate-400">Enter your credentials to access the secure administrative workspace.</p>
          </div>

          <div className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Administrator Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#09090b] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
                    placeholder="admin@quickshow.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Master Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#09090b] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wide rounded-lg py-3.5 transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)] hover:shadow-[0_0_25px_rgba(229,9,20,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Authorize Access'}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold">
            &copy; {new Date().getFullYear()} QuickShow Secure Systems
          </p>
        </div>
      </div>
    </div>
  );
}

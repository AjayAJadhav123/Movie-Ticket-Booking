import { SignIn, useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Film, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function AdminLogin() {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const exchangeToken = async () => {
      if (isSignedIn) {
        setIsExchanging(true);
        try {
          const token = await getToken();
          const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
          const res = await fetch(`${API_BASE}/api/admin/auth/exchange`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const data = await res.json();
          
          if (data.success && data.adminToken) {
            localStorage.setItem('adminToken', data.adminToken);
            toast.success('Admin login successful!');
            await signOut(); // Destroy Clerk session to isolate public session
            window.location.href = '/admin/dashboard'; // Force full reload to reset all states
          } else {
            toast.error(data.message || 'Not authorized as admin');
            await signOut();
            navigate('/sign-in', { replace: true });
          }
        } catch (error) {
          console.error('Token exchange failed:', error);
          toast.error('Authentication error occurred');
          await signOut();
          navigate('/sign-in', { replace: true });
        } finally {
          setIsExchanging(false);
        }
      }
    };

    exchangeToken();
  }, [isSignedIn, getToken, signOut, navigate]);

  // Loading / exchanging state
  if (!isLoaded || isExchanging) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          {isExchanging && (
            <p className="text-sm text-slate-500 font-medium">Verifying admin credentials...</p>
          )}
        </div>
      </div>
    );
  }

  // If already have an admin token, redirect to dashboard
  if (localStorage.getItem('adminToken') && !isSignedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient glow — purely decorative, pointer-events-none */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            top: '-80px',
            right: '-120px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.10) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '400px',
            height: '400px',
            bottom: '-60px',
            left: '-80px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Card */}
      <div
        className={`relative w-full max-w-[420px] transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* White card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
          
          {/* Card header */}
          <div className="pt-8 pb-6 px-8 text-center border-b border-slate-100">

            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Quick<span className="text-indigo-600">Show</span>
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 leading-snug">
              Sign in to access the QuickShow Admin Panel
            </p>

            {/* Admin access badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck size={12} />
              Admin access only
            </div>
          </div>

          {/* Clerk SignIn widget */}
          <div className="px-2 pb-2">
            <SignIn
              routing="hash"
              fallbackRedirectUrl="/admin/dashboard"
              appearance={{
                layout: {
                  socialButtonsPlacement: 'bottom',
                  socialButtonsVariant: 'blockButton',
                },
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 rounded-none bg-transparent p-6',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  logoBox: 'hidden',

                  // Form fields
                  formFieldLabel:
                    'text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1',
                  formFieldInput:
                    'rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm px-3 py-2.5 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors',
                  formFieldInputShowPasswordButton:
                    'text-slate-400 hover:text-slate-700',

                  // Primary button — dark/black per reference
                  formButtonPrimary:
                    'w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors shadow-sm',

                  // Footer links
                  footerActionLink:
                    'text-indigo-600 hover:text-indigo-700 font-semibold text-sm',
                  footerAction: 'text-slate-500 text-sm',

                  // Divider
                  dividerRow: 'my-2',
                  dividerLine: 'bg-slate-200',
                  dividerText: 'text-slate-400 text-xs font-medium',

                  // Social buttons (Google etc.)
                  socialButtonsBlockButton:
                    'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg py-2.5 transition-colors text-sm',
                  socialButtonsBlockButtonText: 'font-semibold text-slate-700',
                  socialButtonsProviderIcon: 'w-4 h-4',

                  // Forgot password
                  formFieldAction:
                    'text-xs text-slate-400 hover:text-slate-700 transition-colors',

                  // Identity preview
                  identityPreviewEditButtonIcon: 'text-slate-600',
                  identityPreviewText: 'text-slate-900',

                  // Alert/error
                  alert: 'rounded-lg border-red-100 bg-red-50 text-red-700 text-sm',
                  alertText: 'text-sm',

                  // OTP/verification inputs
                  otpCodeFieldInput:
                    'border border-slate-200 rounded-lg text-slate-900 focus:border-slate-400',
                },
                variables: {
                  colorPrimary: '#0f172a',
                  colorText: '#0f172a',
                  colorTextSecondary: '#64748b',
                  colorBackground: 'transparent',
                  colorInputBackground: '#f8fafc',
                  colorInputText: '#0f172a',
                  borderRadius: '0.5rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontSize: '14px',
                },
              }}
            />
          </div>
        </div>

        {/* Below-card footer */}
        <p className="text-center text-xs text-slate-400 mt-5">
          &copy; {new Date().getFullYear()} QuickShow &middot; Restricted admin portal
        </p>
      </div>
    </div>
  );
}

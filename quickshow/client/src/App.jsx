import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, RedirectToSignIn, useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { ToastContainer, toast } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIButton from './components/AIButton';
import AIChat from './components/AIChat';
import { AppProvider } from './context/AppContext';

import Home from './pages/Home';
import AllMovies from './pages/AllMovies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import MyBookings from './pages/MyBookings';
import BookingTicket from './pages/BookingTicket';
import Favorites from './pages/Favorites';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AddShow from './pages/admin/AddShow';
import ListShows from './pages/admin/ListShows';
import AdminMovies from './pages/admin/AdminMovies';
import ViewBookings from './pages/admin/ViewBookings';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import ManageCinemas from './pages/admin/ManageCinemas';
import ManageScreens from './pages/admin/ManageScreens';
import AdminLayout from './components/admin/AdminLayout';
import { Outlet } from 'react-router-dom';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Validate key format to detect if Stripe key was mistakenly used
const isValidClerkKeyFormat = clerkPubKey && /^pk_test_[\w]+$/.test(clerkPubKey);
const isStripeKeyFormat = clerkPubKey && clerkPubKey.includes('VFbE1M6AKJxN7MqV'); // Specific to the Stripe key in use

function ProtectedAdminRoute({ children }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [status, setStatus] = useState('loading'); // 'loading' | 'admin' | 'denied' | 'unauthenticated' | 'denied_redirect'

  useEffect(() => {
    // Only run this check if we are in the initial 'loading' state
    // This prevents infinite loops and duplicate API calls
    if (status !== 'loading') return;

    const adminToken = localStorage.getItem('adminToken');
    
    console.log('[ADMIN ROUTE DEBUG] adminToken:', adminToken ? 'Present' : 'None');
    console.log('[ADMIN ROUTE DEBUG] isLoaded:', isLoaded);
    console.log('[ADMIN ROUTE DEBUG] user:', user ? 'Present' : 'None');
    
    // If not using adminToken and Clerk is still loading, wait
    if (!adminToken && !isLoaded) return;

    // Call the backend for an authoritative admin check.
    const performAdminCheck = async () => {
      // Prioritize the custom admin token
      let tokenToVerify = adminToken;
      
      // If no admin token, fallback to Clerk token if logged in
      if (!tokenToVerify) {
        if (!user) {
          console.log('[ADMIN ROUTE DEBUG] No token and no user - unauthenticated');
          setStatus('unauthenticated');
          return;
        }
        console.log('[ADMIN ROUTE DEBUG] Getting Clerk token...');
        tokenToVerify = await getToken();
      }

      if (!tokenToVerify) {
        console.log('[ADMIN ROUTE DEBUG] No token available - unauthenticated');
        setStatus('unauthenticated');
        return;
      }

      const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      console.log('[ADMIN ROUTE DEBUG] Checking admin with API:', API_BASE);
      
      try {
        const res = await fetch(`${API_BASE}/api/user/check-admin`, {
          headers: { Authorization: `Bearer ${tokenToVerify}` },
        });

        console.log('[ADMIN ROUTE DEBUG] Response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('[ADMIN ROUTE DEBUG] Response not OK:', errorText);
          localStorage.removeItem('adminToken'); // Clear invalid token
          await signOut();
          toast.error('Admin access required.');
          setStatus('denied_redirect');
          return;
        }

        const data = await res.json();
        console.log('[ADMIN ROUTE DEBUG] Response data:', data);

        if (data.isAdmin) {
          console.log('[ADMIN ROUTE DEBUG] Admin verified ✅');
          setStatus('admin');
        } else {
          console.log('[ADMIN ROUTE DEBUG] Not admin ❌');
          localStorage.removeItem('adminToken');
          await signOut();
          toast.error('Admin access required.');
          setStatus('denied_redirect');
        }
      } catch (err) {
        console.error('[ADMIN CHECK] Error:', err.message);
        localStorage.removeItem('adminToken'); // Ensure token is cleared on crash
        await signOut();
        toast.error('Admin authentication error.');
        setStatus('denied_redirect');
      }
    };

    performAdminCheck();
  }, [isLoaded, user, getToken, signOut, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500">Checking authorization...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || status === 'denied_redirect') {
    console.log('[ADMIN ROUTE DEBUG] Redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">Your account does not have administrator privileges.</p>
          <a href="/" className="inline-flex items-center justify-center w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors">
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return children;
}

function ProtectedRoute({ children }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <RedirectToSignIn />;
  }

  return children;
}

export default function App() {
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">⚠️ Configuration Required</h1>
          <p className="text-gray-600 mb-4">
            Clerk authentication is not configured.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Add <code className="bg-gray-100 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> to <code className="bg-gray-100 px-2 py-1 rounded">.env</code>
          </p>
          <p className="text-xs text-gray-400">
            Get your Clerk key from: https://dashboard.clerk.com/
          </p>
        </div>
      </div>
    );
  }

  if (!isValidClerkKeyFormat) {
    let errorMessage = 'The Clerk publishable key format is invalid.';
    if (isStripeKeyFormat) {
      errorMessage = 'ERROR: A Stripe key was detected in VITE_CLERK_PUBLISHABLE_KEY. Clerk and Stripe keys must be separate.';
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">⚠️ Invalid Clerk Key</h1>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <div className="text-left bg-gray-100 p-3 rounded text-xs mb-4">
            <p className="font-mono text-red-700 mb-2">❌ Current format detected:</p>
            <p className="text-gray-700 break-words mb-4">Stripe-like key (needs Clerk key instead)</p>
            <p className="font-mono text-green-700 mb-2">✓ Expected format:</p>
            <p className="text-gray-700">Clerk publishable key from Clerk Dashboard</p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            <strong>Action Required:</strong>
          </p>
          <ol className="text-xs text-gray-600 text-left space-y-2">
            <li>1. Go to https://dashboard.clerk.com/</li>
            <li>2. Create or select your application</li>
            <li>3. Copy the Publishable Key (not API Key)</li>
            <li>4. Update <code className="bg-white px-1">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="bg-white px-1">.env</code></li>
            <li>5. Keep <code className="bg-white px-1">VITE_STRIPE_PUBLIC_KEY</code> unchanged</li>
            <li>6. Restart the dev server</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <BrowserRouter>
        <AppProvider>
          <AIContent />
        </AppProvider>
      </BrowserRouter>
    </ClerkProvider>
  );
}

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow bg-white">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function AIContent() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Routes>
        {/* Public Routes with Navbar and Footer */}
        <Route element={<PublicLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<AllMovies />} />
          <Route path="/movie/:id" element={<MovieDetails />} />

          {/* Standard Auth Routes */}
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          {/* Protected Public Routes */}
          <Route path="/seat-layout/:showId" element={<ProtectedRoute><SeatLayout /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/booking/:bookingId" element={<ProtectedRoute><BookingTicket /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          {/* Admin Login at /admin exactly */}
          <Route index element={<AdminLogin />} />
          
          {/* Admin Dashboard with Sidebar (No public Navbar/Footer) */}
          <Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="cinemas" element={<ManageCinemas />} />
            <Route path="screens" element={<ManageScreens />} />
            <Route path="movies" element={<AdminMovies />} />
            <Route path="add-shows" element={<AddShow />} />
            <Route path="list-shows" element={<ListShows />} />
            <Route path="bookings" element={<ViewBookings />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* AI Chat - Only show if signed in */}
      {isSignedIn && (
        <>
          <AIButton isOpen={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
          <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Toaster position="top-right" />
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
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
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PaymentCallback from './pages/PaymentCallback';

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


function ProtectedAdminRoute({ children }) {
  const { adminToken, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500">Checking authorization...</p>
      </div>
    );
  }

  if (!adminToken) {
    toast.error('Admin access required.');
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppProvider>
          <AIContent />
        </AppProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main className="flex-grow bg-[#0a0a0a] pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

function AIContent() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isSignedIn } = useAuth();

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
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resettoken" element={<ResetPassword />} />

          {/* Protected Public Routes */}
          <Route path="/seat-layout/:showId" element={<ProtectedRoute><SeatLayout /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
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

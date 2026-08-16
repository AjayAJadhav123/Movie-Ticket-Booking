import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AppProvider } from './context/AppContext';

import Home from './pages/Home';
import AllMovies from './pages/AllMovies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import MyBookings from './pages/MyBookings';
import BookingTicket from './pages/BookingTicket';
import Favorites from './pages/Favorites';

import AdminDashboard from './pages/admin/AdminDashboard';
import AddShow from './pages/admin/AddShow';
import ListShows from './pages/admin/ListShows';
import AdminMovies from './pages/admin/AdminMovies';
import ViewBookings from './pages/admin/ViewBookings';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ProtectedAdminRoute({ children }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <RedirectToSignIn />;
  }

  const isAdmin =
    user.publicMetadata?.isAdmin === true || user.privateMetadata?.isAdmin === true;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
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
            Clerk authentication is not configured yet.
          </p>
          <p className="text-sm text-gray-500">
            To enable authentication, add <code className="bg-gray-100 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> to <code className="bg-gray-100 px-2 py-1 rounded">.env</code>
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Backend is running. Public pages can be accessed without authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <AppProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<AllMovies />} />
                <Route path="/movie/:id" element={<MovieDetails />} />

                {/* Auth Routes */}
                <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
                <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />

                {/* Protected Routes */}
                <Route
                  path="/seat-layout/:showId"
                  element={
                    <ProtectedRoute>
                      <SeatLayout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking/:bookingId"
                  element={
                    <ProtectedRoute>
                      <BookingTicket />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <Favorites />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/movies"
                  element={
                    <ProtectedAdminRoute>
                      <AdminMovies />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/add-shows"
                  element={
                    <ProtectedAdminRoute>
                      <AddShow />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/list-shows"
                  element={
                    <ProtectedAdminRoute>
                      <ListShows />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/bookings"
                  element={
                    <ProtectedAdminRoute>
                      <ViewBookings />
                    </ProtectedAdminRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>

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
          />
        </AppProvider>
      </BrowserRouter>
    </ClerkProvider>
  );
}

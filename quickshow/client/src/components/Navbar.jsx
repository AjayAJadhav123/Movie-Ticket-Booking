import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Menu, X, Film, Heart } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-4">
        <div className="flex justify-between items-center gap-2 md:gap-4">
          <Link to="/" className="flex items-center gap-1 md:gap-2 font-bold hover:opacity-90 transition flex-shrink-0" onClick={closeMobileMenu}>
            <Film size={24} className="md:hidden" />
            <Film size={28} className="hidden md:block" />
            <span className="text-base md:text-2xl hidden sm:inline">QuickShow</span>
          </Link>

          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            <Link to="/" className="hover:opacity-90 transition text-sm lg:text-base">Home</Link>
            <Link to="/movies" className="hover:opacity-90 transition text-sm lg:text-base">Movies</Link>
            
            {isSignedIn && (
              <>
                <Link to="/my-bookings" className="hover:opacity-90 transition text-sm lg:text-base">My Bookings</Link>
                <Link to="/favorites" className="hover:opacity-90 transition flex items-center gap-1 text-sm lg:text-base">
                  <Heart size={18} className="lg:hidden" /> 
                  <Heart size={20} className="hidden lg:block" /> 
                  <span className="hidden lg:inline">Favorites</span>
                </Link>
                
                {user?.publicMetadata?.isAdmin && (
                  <Link to="/admin/dashboard" className="bg-yellow-500 px-3 md:px-4 py-1 md:py-2 rounded-lg font-semibold hover:bg-yellow-600 transition text-sm lg:text-base">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <button
                onClick={() => {
                  navigate('/sign-in');
                  closeMobileMenu();
                }}
                className="bg-white text-indigo-600 px-2 md:px-4 py-1 md:py-2 rounded-lg font-semibold hover:opacity-90 transition text-xs md:text-sm"
              >
                Sign In
              </button>
            )}

            <button
              className="md:hidden text-white p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 flex flex-col gap-2 pb-3 border-t border-indigo-500 pt-3">
            <Link to="/" className="px-3 py-2 hover:bg-indigo-700 rounded transition text-sm" onClick={closeMobileMenu}>Home</Link>
            <Link to="/movies" className="px-3 py-2 hover:bg-indigo-700 rounded transition text-sm" onClick={closeMobileMenu}>Movies</Link>
            
            {isSignedIn && (
              <>
                <Link to="/my-bookings" className="px-3 py-2 hover:bg-indigo-700 rounded transition text-sm" onClick={closeMobileMenu}>My Bookings</Link>
                <Link to="/favorites" className="px-3 py-2 hover:bg-indigo-700 rounded transition flex items-center gap-2 text-sm" onClick={closeMobileMenu}>
                  <Heart size={16} /> Favorites
                </Link>
                
                {user?.publicMetadata?.isAdmin && (
                  <Link to="/admin/dashboard" className="bg-yellow-500 px-3 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition text-sm mx-0" onClick={closeMobileMenu}>
                    Admin Dashboard
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

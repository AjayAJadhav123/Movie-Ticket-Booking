import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Menu, X, Heart, Search, Bell } from 'lucide-react';

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      closeMobileMenu();
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex justify-between items-center gap-4">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 font-bold hover:opacity-90 transition flex-shrink-0"
            onClick={closeMobileMenu}
          >
            <img 
              src="/quickshow-logo.svg" 
              alt="QuickShow" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link 
              to="/" 
              className="px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition text-sm"
            >
              Home
            </Link>
            <Link 
              to="/movies" 
              className="px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition text-sm"
            >
              Movies
            </Link>
            
            {isSignedIn && (
              <>
                <Link 
                  to="/my-bookings" 
                  className="px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition text-sm"
                >
                  Bookings
                </Link>
                <Link 
                  to="/favorites" 
                  className="px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition flex items-center gap-1 text-sm"
                >
                  <Heart size={16} /> Favorites
                </Link>
                
                {user?.publicMetadata?.isAdmin && (
                  <Link 
                    to="/admin/dashboard" 
                    className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Search Bar - Desktop */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 max-w-xs ml-4"
          >
            <div className="relative w-full">
              <input 
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-900 placeholder-slate-500 rounded-lg px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-600 transition"
              >
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Icon - Mobile */}
            <button 
              onClick={() => {
                const query = prompt('Search movies:');
                if (query?.trim()) {
                  navigate(`/movies?search=${encodeURIComponent(query)}`);
                }
              }}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition"
            >
              <Search size={20} />
            </button>

            {/* Notifications */}
            <button className="hidden md:flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User */}
            {isSignedIn ? (
              <div className="hidden md:block">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate('/sign-in');
                  closeMobileMenu();
                }}
                className="hidden md:block px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-200 pt-4 space-y-2">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition text-sm"
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link 
              to="/movies" 
              className="block px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition text-sm"
              onClick={closeMobileMenu}
            >
              Movies
            </Link>
            
            {isSignedIn && (
              <>
                <Link 
                  to="/my-bookings" 
                  className="block px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition text-sm"
                  onClick={closeMobileMenu}
                >
                  My Bookings
                </Link>
                <Link 
                  to="/favorites" 
                  className="block px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition flex items-center gap-2 text-sm"
                  onClick={closeMobileMenu}
                >
                  <Heart size={16} /> Favorites
                </Link>
                
                {user?.publicMetadata?.isAdmin && (
                  <Link 
                    to="/admin/dashboard" 
                    className="block px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition text-sm font-medium"
                    onClick={closeMobileMenu}
                  >
                    Admin Dashboard
                  </Link>
                )}

                <div className="pt-2 mt-2 border-t border-slate-200">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                </div>
              </>
            )}

            {!isSignedIn && (
              <button
                onClick={() => {
                  navigate('/sign-in');
                  closeMobileMenu();
                }}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

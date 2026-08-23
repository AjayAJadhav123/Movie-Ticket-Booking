import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Menu, X, Search } from 'lucide-react';

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileSearchRef = useRef(null);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMobileSearchOpen(false);
      closeMobileMenu();
    }
  };

  // Focus the mobile search input when it opens
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'text-indigo-600 bg-indigo-50'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-90 transition-opacity"
            onClick={closeMobileMenu}
          >
            <img
              src="/quickshow-logo.svg"
              alt="QuickShow"
              className="h-9 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/movies" className={navLinkClass}>
              Movies
            </NavLink>

            {isSignedIn && (
              <>
                <NavLink to="/my-bookings" className={navLinkClass}>
                  Bookings
                </NavLink>
                <NavLink to="/favorites" className={navLinkClass}>
                  Favorites
                </NavLink>
              </>
            )}
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 max-w-xs"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 rounded-lg px-3 py-2 pr-9 text-sm border border-transparent focus:outline-none focus:border-indigo-400 focus:bg-white transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                aria-label="Search"
              >
                <Search size={15} />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => {
                setMobileSearchOpen((v) => !v);
                setMobileMenuOpen(false);
              }}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle search"
            >
              {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* User Button */}
            {isSignedIn ? (
              <div className="hidden md:block">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8',
                    },
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate('/sign-in');
                  closeMobileMenu();
                }}
                className="hidden md:inline-flex btn-primary text-sm py-2 px-4"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              onClick={() => {
                setMobileMenuOpen((v) => !v);
                setMobileSearchOpen(false);
              }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (slide-down) */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 animate-fade-in-up">
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={mobileSearchRef}
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 pr-10 text-sm border border-transparent focus:outline-none focus:border-indigo-400 focus:bg-white transition"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                aria-label="Search"
              >
                <Search size={15} />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 pt-3 space-y-1 animate-fade-in-up">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
              onClick={closeMobileMenu}
            >
              Home
            </NavLink>
            <NavLink
              to="/movies"
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
              onClick={closeMobileMenu}
            >
              Movies
            </NavLink>

            {isSignedIn && (
              <>
                <NavLink
                  to="/my-bookings"
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                  onClick={closeMobileMenu}
                >
                  My Bookings
                </NavLink>
                <NavLink
                  to="/favorites"
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                  onClick={closeMobileMenu}
                >
                  Favorites
                </NavLink>

                <div className="pt-3 mt-2 border-t border-slate-100 px-3">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-8 h-8',
                      },
                    }}
                  />
                </div>
              </>
            )}

            {!isSignedIn && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    navigate('/sign-in');
                    closeMobileMenu();
                  }}
                  className="w-full btn-primary text-sm py-2.5"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, MapPin, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function UserDropdown({ user, logout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary overflow-hidden border border-slate-700"
      >
        {user?.image ? (
          <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-semibold text-sm">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50 ring-1 ring-slate-800">
          <div className="px-4 py-2 border-b border-slate-800">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          {user?.isAdmin && (
            <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-primary hover:bg-slate-800 w-full text-left font-medium">
              Admin Dashboard
            </Link>
          )}
          <button 
            onClick={() => {
              logout();
              setIsOpen(false);
            }} 
            className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white text-left transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { isLoaded, isSignedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDesktopSearch, setShowDesktopSearch] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowDesktopSearch(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'text-primary bg-primary/10'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-slate-900 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Left: Location (Mobile & Desktop) */}
          <div className="flex items-center gap-1.5 text-slate-300 flex-1">
            <MapPin size={18} className="text-slate-400" />
            <span className="text-sm font-medium">Pune</span>
          </div>

          {/* Center: Brand */}
          <Link
            to="/"
            className="flex items-center justify-center flex-1"
          >
            <img src="/logo.png" alt="QuickShow" className="h-8 md:h-10 object-contain" />
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-3 flex-1">
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1 mr-4">
              <NavLink to="/" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/movies" className={navLinkClass}>Movies</NavLink>
              {isSignedIn && (
                <>
                  <NavLink to="/my-bookings" className={navLinkClass}>Bookings</NavLink>
                  <NavLink to="/favorites" className={navLinkClass}>Favorites</NavLink>
                </>
              )}
            </div>

            {/* Desktop Search Toggle */}
            <div className="hidden md:flex items-center">
              {showDesktopSearch ? (
                <form onSubmit={handleSearch} className="relative animate-fade-in flex items-center">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-48 bg-slate-900 text-white placeholder-slate-500 rounded-full px-4 py-1.5 pr-8 text-sm border border-slate-700 focus:outline-none focus:border-primary transition-all"
                  />
                  <button type="button" onClick={() => setShowDesktopSearch(false)} className="absolute right-2 text-slate-500 hover:text-white">
                    <Search size={14} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowDesktopSearch(true)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            {/* Mobile Search Icon */}
            <button className="md:hidden text-slate-400 hover:text-white p-1" onClick={() => navigate('/movies')}>
              <Search size={22} />
            </button>

            {/* User Auth / Profile (Desktop only, mobile uses BottomNav) */}
            <div className="hidden md:block">
              {!isLoaded ? (
                <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse border border-slate-700 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-slate-700"></div>
                </div>
              ) : isSignedIn ? (
                <UserDropdown user={user} logout={logout} />
              ) : (
                <button
                  onClick={() => navigate('/sign-in')}
                  className="btn-primary text-sm py-1.5 px-4 rounded-full"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

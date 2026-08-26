import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Film, Ticket, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { isSignedIn } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-slate-800 z-50 px-6 py-3 flex justify-between items-center text-xs font-medium">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
      >
        <Home size={24} />
        <span>Home</span>
      </NavLink>

      <NavLink 
        to="/movies" 
        className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
      >
        <Film size={24} />
        <span>Movies</span>
      </NavLink>

      <NavLink 
        to={isSignedIn ? "/my-bookings" : "/sign-in"} 
        className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
      >
        <Ticket size={24} />
        <span>Bookings</span>
      </NavLink>

      <NavLink 
        to={isSignedIn ? "/profile" : "/sign-in"} 
        className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-300'}`}
      >
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </div>
  );
}

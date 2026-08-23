import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Film, 
  Building2, 
  Monitor, 
  Ticket,
  CalendarDays,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Search,
  Bell
} from 'lucide-react';
import AdminErrorBoundary from './AdminErrorBoundary';

const ADMIN_LINKS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/movies', icon: Film, label: 'Movies' },
  { path: '/admin/cinemas', icon: Building2, label: 'Cinemas' },
  { path: '/admin/screens', icon: Monitor, label: 'Screens' },
  { path: '/admin/add-shows', icon: CalendarDays, label: 'Add Shows' },
  { path: '/admin/list-shows', icon: CalendarDays, label: 'Manage Shows' },
  { path: '/admin/bookings', icon: Ticket, label: 'Bookings' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const payloadStr = atob(token.split('.')[1]);
        setAdminUser(JSON.parse(payloadStr));
      } catch (e) {
        console.error('Invalid admin token');
      }
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const currentRouteName = ADMIN_LINKS.find(link => link.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 flex flex-col shadow-[2px_0_8px_rgba(0,0,0,0.02)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
             <div className="bg-indigo-600 rounded-lg p-1.5 shadow-sm">
               <Film size={20} className="text-white" />
             </div>
             <span className="text-xl font-bold text-slate-900 tracking-tight">Quick<span className="text-indigo-600">Show</span></span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 custom-scrollbar">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[14px] font-medium
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <Icon size={18} className="flex-shrink-0" strokeWidth={2.2} />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {adminUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{adminUser?.name || 'Admin User'}</p>
              <p className="text-[13px] text-slate-500 truncate">{adminUser?.email || 'admin@quickshow.com'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 font-medium transition text-[14px] shadow-sm"
          >
            <LogOut size={16} strokeWidth={2.5} />
            Logout Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F9FAFB]">
        
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            
            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center text-[14px] font-medium text-slate-500">
              <span className="hover:text-slate-800 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>Admin</span>
              <ChevronRight size={14} className="mx-2 text-slate-400" />
              <span className="text-indigo-600">{currentRouteName}</span>
            </div>
          </div>

          {/* Search bar (center) */}
          <div className="hidden md:flex items-center max-w-md w-full mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search movies, cinemas, shows..." 
                className="block w-full pl-10 pr-12 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">Ctrl /</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            {/* Notification Bell */}
            <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            {/* Admin Avatar Compact */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm hidden sm:flex">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{adminUser?.name || 'Admin User'}</p>
                <p className="text-[12px] text-slate-500 leading-tight">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </main>
      </div>

    </div>
  );
}

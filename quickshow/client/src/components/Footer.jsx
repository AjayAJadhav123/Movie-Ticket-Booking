import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/quickshow-logo.svg" 
                alt="QuickShow" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Premium movie ticket booking platform offering seamless cinema experience with secure payments.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-slate-900 font-semibold mb-4 text-sm uppercase tracking-wide">Navigation</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-slate-600 hover:text-indigo-600 transition text-sm">Home</Link></li>
              <li><Link to="/movies" className="text-slate-600 hover:text-indigo-600 transition text-sm">Movies</Link></li>
              <li><Link to="/my-bookings" className="text-slate-600 hover:text-indigo-600 transition text-sm">My Bookings</Link></li>
              <li><Link to="/favorites" className="text-slate-600 hover:text-indigo-600 transition text-sm">Favorites</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-slate-900 font-semibold mb-4 text-sm uppercase tracking-wide">About</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition text-sm">About QuickShow</a></li>
              <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition text-sm">Blog</a></li>
              <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition text-sm">Careers</a></li>
              <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition text-sm">Press</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-slate-900 font-semibold mb-4 text-sm uppercase tracking-wide">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition text-sm">Contact Us</a></li>
              <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition text-sm">FAQ</a></li>
              <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition text-sm">Terms & Conditions</a></li>
              <li><a href="#" className="text-slate-600 hover:text-indigo-600 transition text-sm">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-slate-900 font-semibold mb-4 text-sm uppercase tracking-wide">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition text-sm">
                <Mail size={16} className="text-indigo-600 flex-shrink-0" />
                <span>support@quickshow.com</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition text-sm">
                <Phone size={16} className="text-indigo-600 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start gap-3 text-slate-600 hover:text-indigo-600 transition text-sm">
                <MapPin size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>123 Cinema Street, Movie City, MC 12345</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-600 text-sm">
              &copy; {currentYear} QuickShow. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a 
                href="#" 
                className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

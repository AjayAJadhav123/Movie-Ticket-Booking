import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#141414] border-t border-slate-800 mt-20">
      <div className="container mx-auto px-4 py-12 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="QuickShow"
                className="h-9 w-auto"
              />
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Fast, reliable movie ticket booking with real-time seat selection and secure payments.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Navigation</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="text-slate-500 hover:text-primary transition text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/movies" className="text-slate-500 hover:text-primary transition text-sm">
                  Movies
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="text-slate-500 hover:text-primary transition text-sm">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-slate-500 hover:text-primary transition text-sm">
                  Favorites
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-slate-500 hover:text-primary transition text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-primary transition text-sm">
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-primary transition text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-primary transition text-sm">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-8">
          <p className="text-slate-400 text-sm text-center">
            &copy; {currentYear} QuickShow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Instagram } from 'lucide-react';
import { NAV_ITEMS } from '../types';
import { FaWhatsapp } from "react-icons/fa";
import { supabase } from '../src/lib/supabase';
import logo from '../assets/logo.png';

export const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-apra-dark">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 text-apra-dark hover:opacity-90 transition-opacity">
              <img
                src={logo}
                alt="APRA Logo"
                className="h-10 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-heading font-bold tracking-tight">APRO</span>
                <span className="text-[10px] font-bold tracking-widest uppercase">Aero Propulsion Rocketry Operations</span>
              </div>
            </NavLink>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `text-sm font-semibold uppercase tracking-wide transition-colors duration-200 ${
                      isActive ? 'text-apra-blue border-b-2 border-apra-blue' : 'text-gray-600 hover:text-apra-dark'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {user ? (
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm font-semibold text-apra-dark">
                    {user.email?.split("@")[0] || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-xs font-bold bg-apra-blue text-white rounded hover:bg-apra-dark transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="ml-4 px-4 py-2 text-xs font-bold bg-apra-blue text-white rounded hover:bg-apra-dark transition"
                >
                  Login
                </NavLink>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-apra-dark"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <nav className="lg:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
            <div className="flex flex-col p-4 space-y-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-md font-semibold ${
                      isActive ? 'bg-apra-dark text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {user ? (
                <div className="px-4 py-2 border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-apra-dark mb-3">
                    {user.email?.split("@")[0] || user.email}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm font-bold bg-apra-blue text-white rounded hover:bg-apra-dark transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 rounded-md font-semibold text-white bg-apra-blue hover:bg-apra-dark transition"
                >
                  Login
                </NavLink>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-apra-dark text-white py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="font-heading font-bold text-lg">APRO</p>
            <p className="text-sm text-gray-300">Copyright © Aero Propulsion Rocketry Operations</p>
            <div className="flex gap-4 text-xs text-gray-400 mt-2">
              <a href="#" className="hover:text-white transition-colors">Terms and Conditions</a>
              {/* <a href="#" className="hover:text-white transition-colors">Network</a> */}
              <NavLink to="/legal" className="hover:text-white transition-colors">Legal</NavLink>
            </div>
          </div>
          <div className="flex gap-6">
            <a href="https://www.instagram.com/apro.pk?igsh=OGY1Mmw4ZWI3MXhx" target="_blank" className="p-2 bg-white/10 rounded-full hover:bg-apra-blue transition-colors">
              <Instagram size={20} />
            </a>
            <a href="https://wa.me/qr/L42ZA7YXDZT3B1" target="_blank" className="p-2 bg-white/10 rounded-full hover:bg-apra-blue transition-colors">
              <FaWhatsapp size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
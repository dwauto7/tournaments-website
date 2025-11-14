import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
// FIX: The useAuth hook is defined in hooks/useAuth.ts, not in context/AuthContext.ts.
import { useAuth } from '../hooks/useAuth';
import Button from './Button';

const GolfBallIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 14c-.83 0-1.5-.67-1.5-1.5S7.67 11 8.5 11s1.5.67 1.5 1.5S9.33 14 8.5 14zm3.5-6.5c-.83 0-1.5-.67-1.5-1.5S11.17 4.5 12 4.5s1.5.67 1.5 1.5S12.83 7.5 12 7.5zm3.5 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3.5 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);


const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `uppercase tracking-wider text-sm font-semibold transition-colors ${
      isActive ? 'text-brand-accent' : 'text-brand-light/70 hover:text-brand-light'
    }`;

  return (
    <header className="bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <NavLink to="/" className="flex items-center gap-3">
          <GolfBallIcon className="w-8 h-8 text-brand-accent" />
          <span className="font-heading uppercase text-2xl tracking-widest text-brand-light">MatchMate</span>
        </NavLink>
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" className={navLinkClasses}>
            Home
          </NavLink>
          {user && (
            <>
              <NavLink to="/tournaments" className={navLinkClasses}>
                My Tournaments
              </NavLink>
              <NavLink to="/create" className={navLinkClasses}>
                Create
              </NavLink>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden sm:inline text-gray-300">Welcome, {user.fullName.split(' ')[0]}!</span>
              <Button onClick={handleLogout} variant="secondary">
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')} variant="outline">
              Login / Sign Up
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;

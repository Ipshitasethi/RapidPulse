import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLng);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const isLanding = location.pathname === '/';

  const NavLinks = () => (
    <>
      {isLanding && (
        <>
          <a href="#how-it-works" className="text-secondary hover:text-white transition-colors text-sm font-medium">
            {t('nav.how_it_works')}
          </a>
          <a href="#for-ngos" className="text-secondary hover:text-white transition-colors text-sm font-medium">
            {t('nav.for_ngos')}
          </a>
          <a href="#for-volunteers" className="text-secondary hover:text-white transition-colors text-sm font-medium">
            {t('nav.for_volunteers')}
          </a>
        </>
      )}
    </>
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#0A0A0F]/80 backdrop-blur-[20px] border-b border-white/10 py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="text-2xl font-bold gradient-text pb-1">
          {t('app.name')}
        </Link>

        {/* Center: Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLinks />
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-secondary hover:text-white transition-colors text-sm font-medium"
          >
            <Globe size={18} />
            <span className="uppercase">{i18n.language}</span>
          </button>

          {currentUser ? (
            <>
              <Link 
                to={userRole === 'ngo' ? '/ngo/dashboard' : '/volunteer/dashboard'}
                className="text-white hover:text-brand-primary transition-colors text-sm font-medium"
              >
                {t('nav.dashboard')}
              </Link>
              <button 
                onClick={handleLogout}
                className="text-secondary hover:text-brand-coral transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-white font-medium hover:text-brand-primary transition-colors text-sm">
                {t('nav.login')}
              </Link>
              <Link to="/signup" className="btn-primary py-2 px-5 text-sm">
                {t('nav.signup')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button onClick={toggleLanguage} className="text-secondary">
            <span className="uppercase text-sm font-bold">{i18n.language}</span>
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0A0A0F] border-b border-white/10 p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <NavLinks />
          </div>
          <div className="h-px bg-white/10 w-full"></div>
          {currentUser ? (
            <div className="flex flex-col gap-4">
              <Link 
                to={userRole === 'ngo' ? '/ngo/dashboard' : '/volunteer/dashboard'}
                className="text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.dashboard')}
              </Link>
              <button onClick={handleLogout} className="text-brand-coral text-left">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Link to="/login" className="text-white" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.login')}
              </Link>
              <Link to="/signup" className="btn-primary text-center" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.signup')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

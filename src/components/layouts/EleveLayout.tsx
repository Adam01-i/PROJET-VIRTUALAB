import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  FlaskRound as Flask,
  Brain,
  Cuboid as Cube,
  Book,
  LogIn,
} from 'lucide-react';
import ImageCarouselBackground from '../ui/ImageCarouselBackground';
import UserMenu from '../../components/ui/UserMenu';
import { supabase } from '../../lib/supabaseClient';

export default function EleveLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  const fullWidthPaths = ["/eleve/experiences", "/eleve/3d", "/eleve/quiz"];
  const isFullWidth = fullWidthPaths.some(path => location.pathname.includes(path));

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !(menuRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const navItems = [
    { path: '/', icon: Book, label: 'Accueil' },
    { path: '/eleve/experiences', icon: Flask, label: 'Simulations' },
    { path: '/eleve/quiz', icon: Brain, label: 'Quiz' },
    { path: '/eleve/3d', icon: Cube, label: 'Visualisation 3D' },
  ];

  return (
    <div className="min-h-screen bg-white text-white">
      {/* ✅ Navbar élève */}
      <nav className={`fixed w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-indigo-900/95 shadow-md' : ''}`}>
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Flask size={20} className="text-purple-300" />
              <span className="text-white font-semibold text-base">VirtuaLab</span>
              {navItems.map(({ path, icon: Icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-purple-200 hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Bouton hamburger mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-purple-200 focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                  />
                </svg>
              </button>
            </div>

            {/* Menu desktop */}
            <div className="hidden md:flex flex-wrap gap-2">
              
              {isLoggedIn ? (
                <UserMenu />
              ) : (
                <NavLink
                  to="/login"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-purple-200 hover:bg-white/5"
                >
                  <LogIn size={16} />
                  <span>Connexion</span>
                </NavLink>
              )}
            </div>
          </div>
        </div>

        {/* Menu mobile avec animation */}
        <div
          ref={menuRef}
          className={`md:hidden absolute top-14 left-0 right-0 bg-indigo-900/95 shadow-md px-4 py-4 space-y-3 z-50 transform transition-transform duration-300 origin-top ${
            isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
          }`}
        >
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${isActive
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-purple-200 hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
          {isLoggedIn ? (
            <UserMenu />
          ) : (
            <NavLink
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-purple-200 hover:bg-white/5"
            >
              <LogIn size={16} />
              <span>Connexion</span>
            </NavLink>
          )}
        </div>
      </nav>

      {/* ✅ Image d'accueil */}
      <section>
        <ImageCarouselBackground />
      </section>

      {/* ✅ Contenu */}
      <main className={isFullWidth ? "w-full px-0 py-0" : "max-w-[1280px] mx-auto px-6 md:px-28 py-10"}>
        <Outlet />
      </main>

      {/* ✅ Footer */}
      <footer className="w-full bg-indigo-900/95 shadow-md text-white mt-auto">
        <div className="border-t border-indigo-600 text-center text-sm text-indigo-200 py-4">
          © {new Date().getFullYear()} VirtuaLaB. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

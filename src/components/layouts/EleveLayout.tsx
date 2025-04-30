import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FlaskRound as Flask, Brain, Cuboid as Cube, Book, LogIn } from 'lucide-react';

export default function EleveLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', icon: Book, label: 'Accueil' },
    { path: '/eleve/experiences', icon: Flask, label: 'Expériences' },
    { path: '/eleve/quiz', icon: Brain, label: 'Quiz' },
    { path: '/eleve/3d', icon: Cube, label: 'Visualisation 3D' },
    { path: '/eleve/login', icon: LogIn, label: 'Se Connecter' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white">
      {/* Barre de navigation élève */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-indigo-900/95 shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Flask size={20} className="text-purple-300" />
              <span className="text-white font-semibold text-base">VirtuaLab</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition duration-150 ${
                    location.pathname === path
                      ? 'bg-white/10 text-white'
                      : 'text-purple-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu de la page élève */}
      <main className="max-w-[1280px] mx-auto px-4 pt-16 pb-10">
        <Outlet />
      </main>
    </div>
  );
}

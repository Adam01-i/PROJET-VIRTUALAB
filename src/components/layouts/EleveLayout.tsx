import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  FlaskRound as Flask,
  Brain,
  Cuboid as Cube,
  Book,
  LogIn,
} from 'lucide-react';
import ImageCarouselBackground from '../views/ImageCarouselBackground';

export default function EleveLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation(); // Liste des chemins où le layout doit être full width
  const fullWidthPaths = ["/eleve/experiences", "/eleve/3d"];

  // Vérifie si l’un des chemins est inclus dans l'URL actuelle
  const isFullWidth = fullWidthPaths.some(path => location.pathname.includes(path));
  

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 700);
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
    <div className="min-h-screen bg-white text-white">

      {/* ✅ Barre de navigation fixe */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-indigo-900/95 shadow-md' : ''}`}>        
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition duration-150 ${location.pathname === path
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

      {/* ✅ Carrousel commence juste après la navbar grâce à pt-14 */}
      <section className="">
        <ImageCarouselBackground />
      </section>

      {/* ✅ Contenu de page (rendu après scroll) */}
      <main className={isFullWidth ? "w-full px-0 py-0" : "max-w-[1280px] mx-auto px-28 py-10"}>
        <Outlet />
      </main>
    </div>
  );
}

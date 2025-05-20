import { useEffect, useState } from 'react';
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

export default function EleveLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const fullWidthPaths = ["/eleve/experiences", "/eleve/3d", "/eleve/quiz"];
  const isFullWidth = fullWidthPaths.some(path => location.pathname.includes(path));

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', icon: Book, label: 'Accueil' },
    { path: '/eleve/experiences', icon: Flask, label: 'Simulations' },
    { path: '/eleve/quiz', icon: Brain, label: 'Quiz' },
    { path: '/eleve/3d', icon: Cube, label: 'Visualisation 3D' },
    { path: '/login', icon: LogIn, label: 'Connexion' },
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
            </div>
            <div className="flex flex-wrap gap-2">
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
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ Section image d'accueil */}
      <section className="">
        <ImageCarouselBackground />
      </section>

      {/* ✅ Contenu dynamique */}
      <main className={isFullWidth ? "w-full px-0 py-0" : "max-w-[1280px] mx-auto px-6 md:px-28 py-10"}>
        <Outlet />
      </main>

      {/* ✅ Footer éducatif */}
      <footer className="w-full bg-indigo-900/95 shadow-md text-white mt-auto">
        <div className="max-w-[1280px] mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <h4 className="text-xl font-bold text-white mb-3">VirtuaLab</h4>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Plateforme immersive pour l'apprentissage de la chimie : expériences virtuelles, visualisations 3D, quiz interactifs et plus encore.
            </p>
          </div>

          <div>
            <h5 className="text-base font-semibold text-white mb-4">Navigation</h5>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li><NavLink to="/eleve/experiences" className="hover:text-white transition">Expériences</NavLink></li>
              <li><NavLink to="/eleve/quiz" className="hover:text-white transition">Quiz</NavLink></li>
              <li><NavLink to="/eleve/3d" className="hover:text-white transition">Visualisation 3D</NavLink></li>
            </ul>
          </div>

          <div>
            <h5 className="text-base font-semibold text-white mb-4">Ressources</h5>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li><a href="#" className="hover:text-white transition">Fiches de révision</a></li>
              <li><a href="#" className="hover:text-white transition">Simulations guidées</a></li>
              <li><a href="#" className="hover:text-white transition">Programme officiel</a></li>
              <li><a href="#" className="hover:text-white transition">Support</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-base font-semibold text-white mb-4">Contact</h5>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li>Email : <a href="mailto:VirtuaLaB@edu.sn" className="hover:text-white">VirtuaLaB@edu.sn</a></li>
              <li>Tél. : <a href="tel:+221777777777" className="hover:text-white">+221 77 777 77 77</a></li>
              <li>Adresse : Bambey, Diourbel, Sénégal</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-indigo-600 text-center text-sm text-indigo-200 py-4">
          © {new Date().getFullYear()} VirtuaLaB. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

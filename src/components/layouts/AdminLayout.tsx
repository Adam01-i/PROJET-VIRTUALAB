import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersRound,
  FileSpreadsheet,
  FlaskRound as Flask,
} from 'lucide-react';
import UserMenu from './../../components/ui/UserMenu';
import { useEffect, useState } from 'react';
import {toast} from 'sonner'; // ✅ Toast import

export default function AdminLayout() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 👉 Toast test (à supprimer si pas nécessaire)
  useEffect(() => {
    toast.success('Bienvenue sur le tableau de bord administrateur 🧪');
  }, []);

  const navItems = [
    { path: '/admin/AdminDashboard', icon: LayoutDashboard, label: 'Dashboard Administrateur' },
    { path: '/admin/AdminUser', icon: FileSpreadsheet, label: 'Gestion Utilisateur' },
    { path: '/admin/AdminClasse', icon: UsersRound, label: 'Gestion Classe' },
    // { path: '/admin/AdminAccount', icon: UsersRound, label: 'Mon Compte' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      {/* 🔵 Top Navbar */}
      <nav className={`fixed w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-indigo-900/95 shadow-md' : 'bg-indigo-900'}`}>
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Flask size={20} className="text-purple-300" />
              <span className="text-white font-semibold text-base">VirtuaLab</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* ⚪ Sub-navbar */}
      <nav className="mt-14 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex justify-center gap-16 py-6 flex-wrap">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `text-sm font-medium px-2 pb-1 border-b-2 transition-all flex items-center gap-1.5
                  ${
                    isActive
                      ? 'text-indigo-700 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* 🌒 Contenu sombre */}
      <main className="flex-1 bg-gray-50 md:bg-gray-100 px-4 py-8">
        <div className="max-w-7xl mx-auto bg-white/90 rounded-md shadow p-6">
          <Outlet />
        </div>
      </main>
      {/* === FOOTER === */}
      <footer className="bg-indigo-900/95 text-white z-40">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="text-xl font-bold mb-3">VirtuaLab</h4>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Plateforme immersive pour l'apprentissage de la chimie : expériences virtuelles, visualisations 3D, quiz interactifs et plus encore.
            </p>
          </div>

          <div>
            <h5 className="text-base font-semibold mb-4">Navigation</h5>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li><NavLink to="/eleve/experiences" className="hover:text-white transition">Expériences</NavLink></li>
              <li><NavLink to="/eleve/quiz" className="hover:text-white transition">Quiz</NavLink></li>
              <li><NavLink to="/eleve/3d" className="hover:text-white transition">Visualisation 3D</NavLink></li>
            </ul>
          </div>

          <div>
            <h5 className="text-base font-semibold mb-4">Ressources</h5>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li><a href="#" className="hover:text-white transition">Fiches de révision</a></li>
              <li><a href="#" className="hover:text-white transition">Simulations guidées</a></li>
              <li><a href="#" className="hover:text-white transition">Programme officiel</a></li>
              <li><a href="#" className="hover:text-white transition">Support</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-base font-semibold mb-4">Contact</h5>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li>Email : <a href="mailto:VirtuaLaB@edu.sn" className="hover:text-white">VirtuaLaB@edu.sn</a></li>
              <li>Tél. : <a href="tel:+221777777777" className="hover:text-white">+221 77 777 77 77</a></li>
              <li>Adresse : Bambey, Diourbel, Sénégal</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-indigo-700 text-center text-sm text-indigo-200 py-4">
          © {new Date().getFullYear()} VirtuaLaB. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

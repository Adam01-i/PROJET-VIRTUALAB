import { Outlet, NavLink } from 'react-router-dom';
import {
  FlaskRound as Flask,
  Brain,
  Cuboid as Cube,
  UsersRound,
  LayoutDashboard,
} from 'lucide-react';
import UserMenu from '../../components/ui/UserMenu';

export default function ProfesseurLayout() {
  const navItems = [
    { path: '/professeur/dashboard', icon: UsersRound, label: 'Dashboard' },
    { path: '/professeur/classes', icon: UsersRound, label: 'Gestion Classes' },
    { path: '/professeur/experiences', icon: Flask, label: 'Gestions Simulations' },
    { path: '/professeur/quiz', icon: Brain, label: 'Gestion Quiz' },
    { path: '/professeur/3D', icon: Cube, label: 'Gestion 3D' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-gray-800 text-base">

      {/* === Corps principal (Sidebar + Main Content en hauteur fixe) === */}
      <div className="flex flex-1 h-[calc(100vh)]">

        {/* 📚 Sidebar (fixe) */}
        <aside className="w-64 bg-white shadow-lg h-full fixed left-0 top-0 pt-0">
          <div className="flex items-center bg-indigo-900/95 gap-3 px-5 py-5 border-b shadow-sm ">
            <LayoutDashboard className="text-white" size={20} />
            <h1 className="text-lg font-semibold tracking-wide text-white">VirtuaLaB</h1>
          </div>

          <nav className="mt-6 flex flex-col space-y-1 px-4 text-sm">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group relative 
                   ${isActive
                    ? 'bg-indigo-100 text-indigo-700 font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-700 rounded-r-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                  }`
                }
              >
                <Icon size={16} className="transition-transform group-hover:scale-110" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* === Contenu principal (à droite de la sidebar) === */}
        <div className="ml-64 flex-1 flex flex-col h-full">

          {/* 🔘 Barre top utilisateur */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-900/95 text-white border-b shadow fixed top-0 left-64 right-0 z-10">
            <h1></h1>
            <UserMenu />
          </div>

          {/* 📄 Contenu (OUTLET) */}
          <main className="flex-1 overflow-y-auto pt-20">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

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

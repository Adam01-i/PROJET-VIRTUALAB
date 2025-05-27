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
        <div className="max-w-[1280px] mx-auto px-4 py-1">
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
      <nav className="fixed w-full z-10 mt-16 bg-white border-b border-gray-200 shadow-sm">
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
        
        <div className="border-t border-indigo-700 text-center text-sm text-indigo-200 py-4">
          © {new Date().getFullYear()} VirtuaLaB. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

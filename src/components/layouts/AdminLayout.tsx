import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersRound,
  FileSpreadsheet,
  FlaskRound as Flask,
} from 'lucide-react';
import MustChangePasswordBanner from '../../components/ui/MustChangePasswordBanner';
import UserMenu from './../../components/ui/UserMenu';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast'; // ✅ Toast import

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
    { path: '/admin/AdminDashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/AdminProfesseur', icon: FileSpreadsheet, label: 'Gestion Professeur' },
    { path: '/admin/AdminEleve', icon: UsersRound, label: 'Gestion Élève' },
    { path: '/admin/AdminAccount', icon: UsersRound, label: 'Mon Compte' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      <MustChangePasswordBanner />

      {/* ✅ Toaster intégré */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #ddd',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#ecfdf5',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#fef2f2',
            },
          },
        }}
      />

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
    </div>
  );
}

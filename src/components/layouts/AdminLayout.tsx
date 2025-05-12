import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCog,
  UsersRound,
  FileSpreadsheet,
  Menu,
  X,
} from 'lucide-react';
import MustChangePasswordBanner from '../../components/ui/MustChangePasswordBanner';
import { supabase } from '../../lib/supabaseClient';
import UserMenu from './../../components/ui/UserMenu';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: UsersRound, label: 'Utilisateurs' },
    { path: '/admin/import-professeurs', icon: FileSpreadsheet, label: 'Import Professeurs' },
    { path: '/admin/settings', icon: UserCog, label: 'Paramètres' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 relative text-base">
      <MustChangePasswordBanner />

      {/* 🟣 Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* ☰ Toggle button mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-50 md:hidden text-indigo-700"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 📂 Sidebar */}
      <aside
        className={`fixed z-40 top-0 left-0 w-64 bg-white shadow transform transition-transform duration-300 ease-in-out
        pt-[3.5rem] md:pt-0 h-full
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:fixed`}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <LayoutDashboard className="text-indigo-600" size={20} />
          <h1 className="text-lg font-bold text-indigo-700 hidden md:block">VirtuaLab Admin</h1>
        </div>

        <nav className="mt-4 flex flex-col space-y-1 px-4 text-sm">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 🔧 Contenu principal */}
      <main className="flex-1 px-4 py-6 md:ml-64 pt-[4rem] md:pt-6 w-full">
        {/* 🔘 Barre top admin avec logout */}
        <div className="fixed w-full md:ml-64 top-0 z-40 flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
        <UserMenu />
        </div>

        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

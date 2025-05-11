import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  FlaskRound as Flask,
  Brain,
  Cuboid as Cube,
  UsersRound,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

export default function ProfesseurLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/professeur/experiences', icon: Flask, label: 'Gestion Simulations' },
    { path: '/professeur/quiz', icon: Brain, label: 'Gestion Quiz' },
    { path: '/professeur/3D', icon: Cube, label: 'Gestion Visualisation 3D' },
    { path: '/professeur/suivi-eleve', icon: UsersRound, label: 'Gestion Classe' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 relative text-base">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Toggle Button (Mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-50 md:hidden text-indigo-700"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed z-40 top-0 left-0 w-64 bg-white shadow transform transition-transform duration-300 ease-in-out
        h-full md:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:fixed`}
      >
        <div className="flex items-center gap-2 px-5 py-3 border-b">
          <LayoutDashboard className="text-indigo-600" size={20} />
          <h1 className="text-lg font-bold text-indigo-700 hidden md:block">VirtuaLab</h1>
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

      {/* Contenu principal */}
      <main className="flex-1 px-4 py-6 md:ml-64">
        <div className="max-w-[1280px] mx-auto text-base">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

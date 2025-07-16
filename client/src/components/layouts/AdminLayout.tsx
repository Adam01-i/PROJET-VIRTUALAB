"use client"

import { useEffect, useRef, useState } from "react"
import { Outlet, NavLink } from "react-router-dom"
import { LayoutDashboard, UsersRound, FileSpreadsheet, FlaskRoundIcon as Flask, Menu, X } from "lucide-react"
import UserMenu from "./../../components/ui/UserMenu"
import { toast } from "sonner"

export default function AdminLayout() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const drawerRef = useRef(null)

  useEffect(() => {
    toast.success("Bienvenue sur le tableau de bord administrateur 🧪")
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDrawerOpen && drawerRef.current && !(drawerRef.current as HTMLElement).contains(event.target as Node)) {
        setIsDrawerOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDrawerOpen])



  const navItems = [
    { path: "/admin/AdminDashboard", icon: LayoutDashboard, label: "Dashboard Administrateur" },
    { path: "/admin/AdminUser", icon: FileSpreadsheet, label: "Gestion Utilisateur" },
    { path: "/admin/AdminClasse", icon: UsersRound, label: "Gestion Classe" },
  ]

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      {/* 🔵 Top Navbar */}
      <nav
        className={`fixed w-full z-40 transition-all duration-300 ${isScrolled ? "bg-indigo-900/95 shadow-md" : "bg-indigo-900"}`}
      >
        <div className="max-w-[1280px] mx-auto px-4 py-1">
          <div className="flex items-center justify-between h-14">
            {/* LEFT: Logo + Menu */}
            <div className="flex items-center gap-4">
              {/* Burger menu (mobile only) */}
              <button className="lg:hidden text-white" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
                {isDrawerOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Logo (desktop only) */}
              <div className="hidden lg:flex items-center gap-2 text-white font-semibold text-lg">
                <Flask size={20} />
                VirtuaLab
              </div>
            </div>

            {/* RIGHT: UserMenu */}
            <div className="ml-auto">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* === Drawer (Mobile / Tablette) === */}
      <div
        ref={drawerRef}
        className={`lg:hidden fixed top-16 left-0 w-64 h-screen bg-white z-40 shadow-md transform transition-transform duration-300 ease-in-out
        ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo VirtuaLab dans le drawer */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Flask size={20} className="text-indigo-600" />
          <span className="text-indigo-800 font-semibold text-lg">VirtuaLab</span>
        </div>

        {/* Navigation mobile */}
        <div className="flex flex-col gap-2 px-4 py-4">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 text-sm py-2 px-3 rounded-md transition-all ${isActive ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Sub-nav visible desktop uniquement */}
      <nav className="hidden lg:block fixed w-full z-10 mt-16 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex justify-center gap-16 py-6">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `text-sm font-medium px-2 pb-1 border-b-2 transition-all flex items-center gap-1.5
                  ${isActive
                    ? "text-indigo-700 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300"
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

      {/* Main content */}
      <main className="flex-1 bg-gray-50 px-4 py-8 pt-28">
        <div className="max-w-7xl mx-auto bg-white/90 rounded-md shadow p-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-indigo-900/95 text-white z-40 mt-auto">
        <div className="border-t border-indigo-700 text-center text-sm text-indigo-200 py-4">
          © {new Date().getFullYear()} VirtuaLaB. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}

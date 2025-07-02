"use client"

import { useState, useEffect, useRef } from "react"
import { Outlet, NavLink } from "react-router-dom"
import { FlaskRoundIcon as Flask, Brain, CuboidIcon as Cube, UsersRound, LayoutDashboard, Menu, X } from "lucide-react"
import UserMenu from "../../components/ui/UserMenu"
import { supabase } from "../../lib/supabaseClient"
import { trackLogin } from "../../utils/eleveActivityTracker"

export default function ProfesseurLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const hasTrackedLogin = useRef(false)

  const navItems = [
    { path: "/professeur/dashboard", icon: UsersRound, label: "Dashboard" },
    { path: "/professeur/classes", icon: UsersRound, label: "Gestion Classes" },
    { path: "/professeur/experiences", icon: Flask, label: "Gestions Simulations" },
    { path: "/professeur/quiz", icon: Brain, label: "Gestion Quiz" },
    { path: "/professeur/3D", icon: Cube, label: "Gestion 3D" },
  ]

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      const isAuthenticated = !!data.session

      // 🎯 Tracker la connexion professeur une seule fois
      if (isAuthenticated && !hasTrackedLogin.current) {
        await trackLogin()
        hasTrackedLogin.current = true
        console.log("✅ Connexion professeur trackée")
      }
    }
    checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" && !hasTrackedLogin.current) {
        await trackLogin()
        hasTrackedLogin.current = true
        console.log("✅ Connexion professeur trackée (auth change)")
      }

      if (event === "SIGNED_OUT") {
        hasTrackedLogin.current = false
        console.log("🚪 Déconnexion professeur")
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && menuRef.current && !(menuRef.current as HTMLElement).contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobileMenuOpen])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-gray-800 text-base">
      <div className="flex flex-1 h-[calc(100vh)]">
        {/* === SIDEBAR === */}
        <aside
          ref={menuRef}
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
          <div className="flex items-center bg-indigo-900/95 gap-3 px-5 py-5 border-b shadow-sm">
            <LayoutDashboard className="text-white" size={20} />
            <h1 className="text-lg font-semibold tracking-wide text-white">VirtuaLaB</h1>
          </div>

          <nav className="mt-6 flex flex-col space-y-1 px-4 text-sm">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group relative 
                  ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700 font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-700 rounded-r-lg"
                      : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                  }`
                }
              >
                <Icon size={16} className="transition-transform group-hover:scale-110" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* === CONTENU PRINCIPAL === */}
        <div className="flex-1 flex flex-col lg:ml-64 h-full">
          {/* === BARRE SUPÉRIEURE === */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-900/95 text-white border-b shadow fixed top-0 left-0 right-0 z-30 lg:left-64">
            {/* Bouton burger visible si < lg */}
            <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-base font-medium"></h1>
            <UserMenu />
          </div>

          {/* === CONTENU === */}
          <main className="flex-1 overflow-y-auto pt-14">
            <div className="max-w-7xl mx-auto p-4">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* === FOOTER === */}
      <footer className="bg-indigo-900/95 text-white z-40 mt-auto">
        <div className="border-t border-indigo-700 text-center text-sm text-indigo-200 py-4">
          © {new Date().getFullYear()} VirtuaLaB. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}

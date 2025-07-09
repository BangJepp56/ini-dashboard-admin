"use client"

import type React from "react"
import { NavLink } from "react-router-dom"
import { LayoutDashboard, Users, UserCheck, Calendar, LogOut, CalendarCheck } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import logoImage from "../assets/logo.png"
const Sidebar: React.FC = () => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/patients", icon: Users, label: "Pasien" },
    { path: "/doctors", icon: UserCheck, label: "Dokter" },
    { path: "/schedules", icon: Calendar, label: "Jadwal Praktek" },
    { path: "/follow-up", icon: CalendarCheck, label: "Jadwal Kontrol" },
  ]

  return (
    <aside className="w-64 h-screen flex flex-col fixed left-0 top-0 z-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm rounded-r-2xl shadow-xl border-r border-white/50" />

      <div className="relative flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-6 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center space-x-3">
  <div className="relative">
    <img 
      src={logoImage} 
      alt="RSIA Prima Qonita Logo" 
      className="w-12 h-12 rounded-xl shadow-lg object-cover"
    />
  </div>
  <div>
    <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
      RSIA Prima Qonita
    </h1>
    <p className="text-sm text-gray-600">Admin Dashboard</p>
  </div>
</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto min-h-0">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg transform scale-105"
                        : "text-gray-700 hover:bg-white/60 hover:text-emerald-600 hover:shadow-md hover:scale-102"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-gray-50/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                      <div className="relative flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            isActive
                              ? "bg-white/20"
                              : "bg-gradient-to-br from-emerald-50 to-emerald-100 group-hover:from-emerald-100 group-hover:to-emerald-200"
                          }`}
                        >
                          <item.icon
                            className={`w-5 h-5 transition-colors duration-300 ${
                              isActive ? "text-white" : "text-emerald-600"
                            }`}
                          />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="p-4 border-t border-white/20 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="group relative flex items-center space-x-3 px-4 py-3 rounded-xl w-full text-gray-700 hover:bg-white/60 hover:text-red-600 transition-all duration-300 hover:shadow-md hover:scale-102"
            type="button"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-gray-50/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 group-hover:from-red-100 group-hover:to-red-200 transition-all duration-300">
                <LogOut className="w-5 h-5 text-red-600 transition-colors duration-300" />
              </div>
              <span className="font-medium">Logout</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, BedDouble, UtensilsCrossed,
  CalendarCheck, Star, CreditCard, LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const navItems = [
  { to: '/hotelier/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/hotelier/etablissement', icon: Building2, label: 'Mon établissement' },
  { to: '/hotelier/chambres', icon: BedDouble, label: 'Chambres' },
  { to: '/hotelier/restauration', icon: UtensilsCrossed, label: 'Restauration' },
  { to: '/hotelier/reservations', icon: CalendarCheck, label: 'Réservations' },
  { to: '/hotelier/avis', icon: Star, label: 'Avis clients' },
  { to: '/hotelier/abonnements', icon: CreditCard, label: 'Abonnement' },
]

export default function SidebarHotelier() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [typeAbonnement, setTypeAbonnement] = useState(null)

  useEffect(() => {
    api.get('/gestionnaire/abonnement/')
      .then(res => setTypeAbonnement(res.data.type_actuel))
      .catch(() => setTypeAbonnement(user?.abonnement || 'freemium'))
  }, [])

  const estPro = typeAbonnement === 'pro'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <NavLink to="/" className="flex items-center">
          <img src="/logo.png.jpeg" alt="PHAROS BÉNIN" className="h-12 w-auto" />
        </NavLink>
        <p className="text-xs text-gray-400 mt-1">Espace Hôtelier</p>
      </div>

      {/* Profil */}
      {user && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">
                {user.nom_complet?.charAt(0)?.toUpperCase() || 'H'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.nom_complet || 'Hôtelier'}</p>
              {typeAbonnement === null ? (
                <span className="text-xs text-gray-300">Chargement...</span>
              ) : estPro ? (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  ⭐ Partenaire Pro
                </span>
              ) : (
                <span className="text-xs text-gray-400">Freemium</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}

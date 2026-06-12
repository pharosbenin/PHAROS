import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, BedDouble, UtensilsCrossed,
  CalendarCheck, Star, CreditCard, LogOut, ChevronDown
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useHotelActif } from '../../context/HotelActifContext'

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
  const { hotels, hotelActif, changerHotel } = useHotelActif() || {}

  useEffect(() => {
    const params = hotelActif ? `?hotel_id=${hotelActif.id}` : ''
    api.get(`/gestionnaire/abonnement/${params}`)
      .then(res => setTypeAbonnement(res.data.type_actuel))
      .catch(() => setTypeAbonnement(user?.abonnement || 'freemium'))
  }, [hotelActif?.id])

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

      {/* Sélecteur d'hôtel (multi-hôtels) */}
      {hotels && hotels.length > 1 && (
        <div className="px-4 pb-3 border-b border-gray-100">
          <label className="text-xs text-gray-400 font-semibold block mb-1.5">Établissement actif</label>
          <div className="relative">
            <select
              value={hotelActif?.id || ''}
              onChange={e => changerHotel(parseInt(e.target.value))}
              className="w-full appearance-none text-xs bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-3 py-2 font-semibold outline-none cursor-pointer pr-7"
            >
              {hotels.map(h => (
                <option key={h.id} value={h.id}>{h.nom}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
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

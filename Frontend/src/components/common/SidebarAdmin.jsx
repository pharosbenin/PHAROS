import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Hotel, Users, Percent,
  CalendarDays, ShieldAlert, LogOut, MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function SidebarAdmin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [demandesCount, setDemandesCount] = useState(0)
  const [messagesNonLus, setMessagesNonLus] = useState(0)

  useEffect(() => {
    api.get('/admin/demandes-upgrade/?statut=en_attente')
      .then(res => setDemandesCount((res.data || []).length))
      .catch(() => setDemandesCount(0))
    api.get('/admin/contacts/')
      .then(res => setMessagesNonLus(res.data?.non_lus ?? 0))
      .catch(() => setMessagesNonLus(0))
  }, [])

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/hotels', icon: Hotel, label: 'Validation hôtels' },
    { to: '/admin/utilisateurs', icon: Users, label: 'Utilisateurs' },
    { to: '/admin/commissions', icon: Percent, label: 'Commissions', badge: demandesCount },
    { to: '/admin/evenements', icon: CalendarDays, label: 'Événements' },
    { to: '/admin/moderation', icon: ShieldAlert, label: 'Modération' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Messages', badge: messagesNonLus },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <NavLink to="/" className="flex items-center">
          <img src="/logo.png.jpeg" alt="PHAROS BÉNIN" className="h-12 w-auto bg-white rounded-lg p-0.5" />
        </NavLink>
        <p className="text-xs text-gray-500 mt-1">Administration</p>
      </div>

      {user && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user.nom?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user.nom || 'Administrateur'}</p>
              <span className="text-xs text-blue-400">Admin</span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => { logout(); navigate('/') }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/30 transition-colors"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}

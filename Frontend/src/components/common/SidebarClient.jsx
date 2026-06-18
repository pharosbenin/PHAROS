import { CalendarCheck, User, LogOut } from 'lucide-react'

const navItems = [
  { id: 'reservations', icon: CalendarCheck, label: 'Mes réservations' },
  { id: 'profil', icon: User, label: 'Mon profil' },
]

export default function SidebarClient({ onglet, setOnglet, user, logout, nbAConfirmer = 0 }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <img src="/logo.png.jpeg" alt="PHAROS BÉNIN" className="h-12 w-auto" />
        <p className="text-xs text-gray-400 mt-1">Espace Client</p>
      </div>

      {/* Profil */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-sm">
              {(user?.prenom || 'J')[0]}{(user?.nom || 'D')[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.prenom} {user?.nom}</p>
            <span className="text-xs text-gray-400">Client PHAROS</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              onglet === id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon size={18} />
              {label}
            </span>
            {id === 'reservations' && nbAConfirmer > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                {nbAConfirmer}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Hotel, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout, isClient, isHotelier, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setDropdownOpen(false)
  }

  const getDashboardLink = () => {
    if (isAdmin()) return '/admin/dashboard'
    if (isHotelier()) return '/hotelier/dashboard'
    return '/client/espace'
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.png.jpeg" alt="PHAROS BÉNIN" className="h-16 w-auto" />
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-black hover:text-[#F57C2B] text-[14px] font-extrabold tracking-wide transition-colors relative group">
              Accueil
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F57C2B] group-hover:w-full transition-all duration-300" />
            </Link>
            <Link to="/recherche" className="text-black hover:text-[#F57C2B] text-[14px] font-extrabold tracking-wide transition-colors relative group">
              Rechercher
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F57C2B] group-hover:w-full transition-all duration-300" />
            </Link>
            <Link to="/a-propos" className="text-black hover:text-[#F57C2B] text-[14px] font-extrabold tracking-wide transition-colors relative group">
              À propos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F57C2B] group-hover:w-full transition-all duration-300" />
            </Link>
            <Link to="/contact" className="text-black hover:text-[#F57C2B] text-[14px] font-extrabold tracking-wide transition-colors relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F57C2B] group-hover:w-full transition-all duration-300" />
            </Link>
            {!user && (
              <Link to="/connexion?type=hotelier" className="text-black hover:text-[#F57C2B] text-[14px] font-extrabold tracking-wide transition-colors relative group">
                Espace hôtelier
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F57C2B] group-hover:w-full transition-all duration-300" />
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-2 transition-colors"
                >
                  {user.photo_profil ? (
                    <img src={user.photo_profil} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.nom?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-24 truncate">
                    {user.prenom || user.nom_complet || 'Mon compte'}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard size={16} />
                      Mon espace
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/connexion"
                  className="text-black hover:bg-black hover:text-white text-[14px] font-extrabold tracking-wide px-4 py-2 rounded-lg transition-all hidden sm:block"
                >
                  Se connecter
                </Link>
                <Link
                  to="/connexion?type=hotelier"
                  className="bg-blue-600 hover:bg-[#F57C2B] text-white text-[14px] font-extrabold px-4 py-2 rounded-lg transition-colors"
                >
                  <span className="hidden sm:inline">Inscrire mon hôtel</span>
                  <Hotel size={18} className="sm:hidden" />
                </Link>
              </div>
            )}

            {/* Menu mobile */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu mobile ouvert */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-black hover:text-[#F57C2B] hover:bg-orange-50 rounded-lg transition-colors">
              Accueil
            </Link>
            <Link to="/recherche" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-black hover:text-[#F57C2B] hover:bg-orange-50 rounded-lg transition-colors">
              Rechercher
            </Link>
            <Link to="/a-propos" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-black hover:text-[#F57C2B] hover:bg-orange-50 rounded-lg transition-colors">
              À propos
            </Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-black hover:text-[#F57C2B] hover:bg-orange-50 rounded-lg transition-colors">
              Contact
            </Link>
            {!user && (
              <>
                <Link to="/connexion" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-black hover:text-[#F57C2B] hover:bg-orange-50 rounded-lg transition-colors">
                  Se connecter
                </Link>
                <Link to="/connexion?type=hotelier" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-blue-600 hover:text-[#F57C2B] font-medium hover:bg-orange-50 rounded-lg transition-colors">
                  Inscrire mon hôtel
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

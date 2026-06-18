import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Normalise les données backend (first_name/last_name) vers le format frontend (prenom/nom)
function normaliserUtilisateur(data) {
  if (!data) return null
  return {
    ...data,
    prenom: data.prenom ?? data.first_name ?? '',
    nom: data.nom ?? data.last_name ?? '',
    nom_complet: data.nom_complet
      ?? (((data.first_name || data.prenom || '') + ' ' + (data.last_name || data.nom || '')).trim()
        || data.username
        || ''),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('pharos_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pharos_user')
    if (stored && token) {
      try {
        setUser(normaliserUtilisateur(JSON.parse(stored)))
      } catch {
        logout()
      }
    }
    setLoading(false)
  }, [])

  // Synchronise la session entre onglets : si un autre onglet du même navigateur
  // se connecte/déconnecte (localStorage partagé), cet onglet doit refléter le
  // même compte au lieu de continuer avec un nom affiché périmé.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'pharos_token' && e.key !== 'pharos_user') return
      const newToken = localStorage.getItem('pharos_token')
      const newUserRaw = localStorage.getItem('pharos_user')
      if (!newToken || !newUserRaw) {
        setUser(null)
        setToken(null)
        return
      }
      try {
        setUser(normaliserUtilisateur(JSON.parse(newUserRaw)))
        setToken(newToken)
      } catch {
        setUser(null)
        setToken(null)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = (userData, accessToken) => {
    const normalized = normaliserUtilisateur(userData)
    setUser(normalized)
    setToken(accessToken)
    localStorage.setItem('pharos_user', JSON.stringify(normalized))
    localStorage.setItem('pharos_token', accessToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('pharos_user')
    localStorage.removeItem('pharos_token')
  }

  const isClient = () => user?.role === 'client'
  const isHotelier = () => user?.role === 'gestionnaire'
  const isAdmin = () => user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isClient, isHotelier, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}

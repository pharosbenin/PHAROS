import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  const justLoggedIn = Boolean(localStorage.getItem('pharos_token')) && Boolean(localStorage.getItem('pharos_user'))

  // Attendre si React n'a pas encore propagé l'état user après un login immédiat
  if (loading || (justLoggedIn && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return <Navigate to="/connexion" replace />

  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'gestionnaire') return <Navigate to="/hotelier/dashboard" replace />
    return <Navigate to="/client/espace" replace />
  }

  return children
}

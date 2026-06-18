import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ChevronRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Layout from '../../components/common/Layout'

export default function Connexion() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const setChamp = (champ, val) => setForm(prev => ({ ...prev, [champ]: val }))

  const connecter = async (e) => {
    e.preventDefault()
    setErreur('')
    if (!form.email || !form.password) { setErreur('Remplissez tous les champs'); return }
    setChargement(true)

    try {
      const res = await api.post('/auth/connexion/', {
        username: form.email,
        password: form.password,
      })

      const { access, refresh } = res.data
      localStorage.setItem('pharos_refresh', refresh)
      localStorage.setItem('pharos_token', access)

      const profilRes = await api.get('/auth/profil/', {
        headers: { Authorization: `Bearer ${access}` }
      })
      const user = profilRes.data

      login(user, access)

      setTimeout(() => {
        if (user.role === 'gestionnaire') navigate('/hotelier/dashboard')
        else if (user.role === 'admin') navigate('/admin/dashboard')
        else navigate('/client/espace')
      }, 100)

    } catch (err) {
      const msg = err.response?.data?.detail || 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
      setErreur(msg)
    } finally {
      setChargement(false)
    }
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          <div className="text-center mb-7">
            <h1 className="text-xl font-black text-gray-900">Connexion</h1>
            <p className="text-sm text-gray-400 mt-1">Accédez à votre espace PHAROS BÉNIN</p>
          </div>

          <form onSubmit={connecter} className="space-y-4" autoComplete="off">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setChamp('email', e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setChamp('password', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 transition-colors"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button type="button" className="text-xs text-blue-600 hover:underline">
                Mot de passe oublié ?
              </button>
            </div>

            {erreur && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{erreur}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {chargement ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                <>Se connecter <ChevronRight size={18} /></>
              )}
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button
              type="button"
              className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-colors text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/recherche" className="text-blue-600 font-semibold hover:underline">Réservez un hébergement</Link> pour en créer un automatiquement.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:text-blue-600 transition-colors">← Retour à l'accueil</Link>
        </p>
      </div>
      </div>
    </Layout>
  )
}

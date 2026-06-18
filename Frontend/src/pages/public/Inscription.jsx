import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, ChevronRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Layout from '../../components/common/Layout'

export default function Inscription() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { login } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    email: state?.email || '',
    password: '',
    prenom: state?.prenom || '',
    nom: state?.nom || '',
    telephone: '',
  })

  const setChamp = (champ, val) => setForm(prev => ({ ...prev, [champ]: val }))

  const inscrire = async (e) => {
    e.preventDefault()
    setErreur('')
    if (!form.email || !form.password || !form.prenom || !form.nom) {
      setErreur('Remplissez tous les champs obligatoires')
      return
    }
    if (form.telephone && (form.telephone.length !== 10 || !form.telephone.startsWith('01'))) {
      setErreur('Le numéro de téléphone doit contenir 10 chiffres et commencer par 01.')
      return
    }
    if (form.password.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setChargement(true)

    try {
      const res = await api.post('/auth/inscription/', {
        username: form.email,
        email: form.email,
        first_name: form.prenom,
        last_name: form.nom,
        telephone: form.telephone ? `+229${form.telephone}` : '',
        password: form.password,
        password2: form.password,
        role: 'client',
      })

      const { tokens, user } = res.data
      localStorage.setItem('pharos_refresh', tokens.refresh)

      login(user, tokens.access)
      navigate('/client/espace')

    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.values(data).flat()
        setErreur(msgs[0] || 'Erreur lors de l\'inscription.')
      } else {
        setErreur('Impossible de contacter le serveur.')
      }
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
            <h1 className="text-xl font-black text-gray-900">Créer un compte</h1>
            <p className="text-sm text-gray-400 mt-1">Rejoignez PHAROS BÉNIN en quelques secondes</p>
          </div>

          <form onSubmit={inscrire} className="space-y-4" autoComplete="off">

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Prénom *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={e => setChamp('prenom', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, ''))}
                    placeholder="Jean"
                    autoComplete="new-password"
                    name="pharos-prenom"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-blue-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Nom *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setChamp('nom', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, ''))}
                  placeholder="Dupont"
                  autoComplete="new-password"
                  name="pharos-nom"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Adresse email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setChamp('email', e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="new-password"
                  name="pharos-email-inscription"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-400"
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Téléphone</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-3 focus-within:border-blue-400 transition-colors">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 font-medium">+229</span>
                <div className="w-px h-4 bg-gray-200" />
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={e => setChamp('telephone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="01XXXXXXXX"
                  className="flex-1 text-sm text-gray-800 outline-none"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Mot de passe *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setChamp('password', e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-blue-400"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1 mt-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      form.password.length >= (i + 1) * 2
                        ? form.password.length >= 8 ? 'bg-green-400' : 'bg-amber-400'
                        : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            {erreur && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{erreur}</p>
              </div>
            )}

            <p className="text-xs text-gray-400">
              En vous inscrivant, vous acceptez les{' '}
              <span className="text-blue-600 cursor-pointer hover:underline">conditions d'utilisation</span>{' '}
              et la{' '}
              <span className="text-blue-600 cursor-pointer hover:underline">politique de confidentialité</span> de PHAROS BÉNIN.
            </p>

            <button
              type="submit"
              disabled={chargement}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {chargement ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Création du compte...
                </span>
              ) : (
                <>Créer mon compte <ChevronRight size={18} /></>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <Link
              to="/inscription-hotelier"
              className="w-full border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-2.5 transition-colors text-sm"
            >
              <Building2 size={16} />
              Inscrire mon établissement hôtelier
            </Link>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-blue-600 font-semibold hover:underline">Se connecter</Link>
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

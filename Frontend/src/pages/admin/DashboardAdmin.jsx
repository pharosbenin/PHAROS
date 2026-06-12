import { useState } from 'react'
import { TrendingUp, TrendingDown, Hotel, Users, BookOpen, Percent, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, Bell, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'
import usePolling from '../../hooks/usePolling'

export default function DashboardAdmin() {
  const navigate = useNavigate()
  const [periode, setPeriode] = useState('mois')
  const [chargement, setChargement] = useState(true)
  const [stats, setStats] = useState({ hotels: [], users: [], commissions: null, reservations: [] })

  const charger = () => {
    Promise.all([
      api.get('/admin/hotels/'),
      api.get('/admin/utilisateurs/'),
      api.get('/admin/commissions/'),
      api.get('/admin/reservations/'),
    ])
      .then(([hRes, uRes, cRes, rRes]) => {
        setStats({
          hotels: hRes.data,
          users: uRes.data,
          commissions: cRes.data,
          reservations: rRes.data,
        })
      })
      .catch(console.error)
      .finally(() => setChargement(false))
  }

  usePolling(charger, 30000)

  const hotels = stats.hotels || []
  const users = stats.users || []
  const commissions = stats.commissions || {}
  const reservations = stats.reservations || []

  const hotelsEnAttente = hotels.filter(h => h.statut === 'en_attente')
  const hotelsValides = hotels.filter(h => h.statut === 'valide')
  const usersActifs = users.filter(u => !u.est_suspendu)
  const totalRevenu = commissions.total_commission_pharos || 0

  const kpis = [
    { label: 'Revenus plateforme', valeur: `${Number(totalRevenu).toLocaleString()} FCFA`, icon: TrendingUp, couleur: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Hôtels enregistrés', valeur: hotels.length, icon: Hotel, couleur: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Utilisateurs actifs', valeur: usersActifs.length, icon: Users, couleur: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Réservations totales', valeur: reservations.length, icon: BookOpen, couleur: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  // Revenus mensuels depuis les commissions
  const revenusMois = (() => {
    const map = {}
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    ;(commissions.commissions || []).forEach(c => {
      const d = new Date(c.date_calcul)
      const key = d.getMonth()
      map[key] = (map[key] || 0) + Number(c.montant_commission)
    })
    return moisLabels.map((mois, i) => ({ mois, montant: map[i] || 0 }))
  })()

  const maxRevenu = Math.max(...revenusMois.map(r => r.montant), 1)

  const hotelsProCount = hotels.filter(h => h.type_abonnement === 'pro').length
  const hotelsFreemiumCount = hotels.filter(h => h.type_abonnement === 'freemium').length

  if (chargement) return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />
      <div className="flex-1 flex items-center justify-center">
        <Loader size={32} className="animate-spin text-blue-500" />
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />

      <div className="flex-1 min-w-0 p-6 lg:p-8">

        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
            <p className="text-gray-400 text-sm mt-0.5">Vue globale de la plateforme PHAROS BENIN</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
              <Bell size={18} className="text-gray-500" />
              {hotelsEnAttente.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="bg-gray-100 rounded-xl p-1 flex text-xs font-semibold">
              {['semaine', 'mois', 'année'].map(p => (
                <button key={p} onClick={() => setPeriode(p)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${periode === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon size={20} className={s.couleur} />
              </div>
              <p className="text-xl font-black text-gray-900">{s.valeur}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Graphique revenus */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900">Revenus mensuels (commissions)</h2>
              <span className="text-xs text-gray-400">En FCFA</span>
            </div>
            {revenusMois.every(r => r.montant === 0) ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Aucune donnée disponible</div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {revenusMois.map((r, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    {r.montant > 0 && (
                      <span className="text-xs text-gray-400 hidden sm:block">{(r.montant / 1000).toFixed(0)}k</span>
                    )}
                    <div
                      className={`w-full rounded-t-lg transition-all ${r.montant > 0 ? 'bg-blue-600' : 'bg-blue-100'}`}
                      style={{ height: `${Math.max((r.montant / maxRevenu) * 100, 4)}%` }}
                    />
                    <span className="text-xs font-medium text-gray-500">{r.mois}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hôtels en attente */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Clock size={15} className="text-amber-500" />
              <h2 className="font-bold text-gray-900">En attente de validation</h2>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{hotelsEnAttente.length}</span>
            </div>
            {hotelsEnAttente.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
                Aucun dossier en attente
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {hotelsEnAttente.slice(0, 4).map(h => (
                  <div key={h.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{h.nom}</p>
                      <p className="text-xs text-gray-400">{h.gestionnaire_nom} · {h.ville}</p>
                    </div>
                    <button onClick={() => navigate('/admin/hotels')}
                      className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 shrink-0 ml-2">
                      Voir
                    </button>
                  </div>
                ))}
                {hotelsEnAttente.length > 4 && (
                  <button onClick={() => navigate('/admin/hotels')}
                    className="w-full text-center py-3 text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
                    Voir tous ({hotelsEnAttente.length}) <ChevronRight size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Résumé abonnements */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <Hotel size={18} className="text-gray-600" />
              </div>
              <p className="font-semibold text-gray-700 text-sm">FREEMIUM</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{hotelsFreemiumCount}</p>
            <p className="text-xs text-gray-400 mt-1">hôtels · commission 3%</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Hotel size={18} className="text-amber-600" />
              </div>
              <p className="font-semibold text-amber-700 text-sm">PRO</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{hotelsProCount}</p>
            <p className="text-xs text-gray-400 mt-1">hôtels · commission 5%</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Percent size={18} className="text-amber-600" />
              </div>
              <p className="font-semibold text-gray-700 text-sm">Commissions perçues</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{Number(totalRevenu).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">FCFA total</p>
          </div>
        </div>

      </div>
    </div>
  )
}

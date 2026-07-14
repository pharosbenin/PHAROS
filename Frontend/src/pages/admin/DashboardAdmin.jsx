import { useState } from 'react'
import { TrendingUp, TrendingDown, Hotel, Users, BookOpen, Percent, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, Bell, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'
import usePolling from '../../hooks/usePolling'

export default function DashboardAdmin() {
  const navigate = useNavigate()
  const [periode, setPeriode] = useState('année')
  const [chargement, setChargement] = useState(true)
  const [stats, setStats] = useState({ hotels: [], users: [], commissions: null, reservations: [] })
  const [derniereMaj, setDerniereMaj] = useState(null)
  const [notifOuverte, setNotifOuverte] = useState(false)

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
        setDerniereMaj(new Date())
      })
      .catch(console.error)
      .finally(() => setChargement(false))
  }

  // Rafraîchissement automatique toutes les 15s (pause quand l'onglet est en arrière-plan) :
  // une nouvelle réservation payée fait donc apparaître sa commission ici sans action de l'admin.
  usePolling(charger, 15000)

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
    { label: 'Hôtels enregistrés', valeur: hotels.filter(h => h.statut !== 'rejete').length, icon: Hotel, couleur: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Utilisateurs actifs', valeur: usersActifs.length, icon: Users, couleur: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Réservations totales', valeur: reservations.length, icon: BookOpen, couleur: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  // Revenus par période sélectionnée : semaine = 7 derniers jours, mois = jours du mois en cours,
  // année = 12 mois de l'année en cours (les commissions d'autres années ne sont plus mélangées).
  const maintenant = new Date()
  const commissionsData = commissions.commissions || []

  const revenusPeriode = (() => {
    if (periode === 'semaine') {
      const labelsJours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      const jours = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(maintenant)
        d.setDate(d.getDate() - (6 - i))
        return d
      })
      return jours.map(d => ({
        label: labelsJours[d.getDay()],
        montant: commissionsData
          .filter(c => new Date(c.date_calcul).toDateString() === d.toDateString())
          .reduce((s, c) => s + Number(c.montant_commission), 0),
      }))
    }

    if (periode === 'mois') {
      const annee = maintenant.getFullYear()
      const moisIdx = maintenant.getMonth()
      const nbJours = new Date(annee, moisIdx + 1, 0).getDate()
      return Array.from({ length: nbJours }, (_, i) => i + 1).map(jour => ({
        label: String(jour),
        montant: commissionsData
          .filter(c => {
            const cd = new Date(c.date_calcul)
            return cd.getFullYear() === annee && cd.getMonth() === moisIdx && cd.getDate() === jour
          })
          .reduce((s, c) => s + Number(c.montant_commission), 0),
      }))
    }

    // année : 12 mois de l'année en cours uniquement
    const annee = maintenant.getFullYear()
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const map = {}
    commissionsData.forEach(c => {
      const cd = new Date(c.date_calcul)
      if (cd.getFullYear() === annee) map[cd.getMonth()] = (map[cd.getMonth()] || 0) + Number(c.montant_commission)
    })
    return moisLabels.map((label, i) => ({ label, montant: map[i] || 0 }))
  })()

  // Arrondit le maximum à une valeur "ronde" (1/2/5 × 10^n) pour des graduations lisibles sur l'axe vertical.
  const arrondirEchelle = (valeur) => {
    if (valeur <= 0) return 1
    const exposant = Math.floor(Math.log10(valeur))
    const base = Math.pow(10, exposant)
    const norme = valeur / base
    const normeRonde = norme <= 1 ? 1 : norme <= 2 ? 2 : norme <= 5 ? 5 : 10
    return normeRonde * base
  }

  const maxRevenu = Math.max(...revenusPeriode.map(r => r.montant), 1)
  const plafondEchelle = arrondirEchelle(maxRevenu)
  const NB_GRADUATIONS = 4
  const graduationsY = Array.from({ length: NB_GRADUATIONS + 1 }, (_, i) => plafondEchelle * (1 - i / NB_GRADUATIONS))
  const formatFCFA = (v) => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `${Math.round(v)}`

  // Hauteur max de la barre en pixels : un % CSS ne fonctionne pas ici car le parent flex
  // (colonne) n'a pas de hauteur définie — on calcule donc directement en pixels.
  const BAR_MAX_PX = 144

  // Valeur réelle (non arrondie) de chaque barre non nulle, positionnée sur l'axe Y en vert,
  // pour lire la hauteur exacte d'une barre (ex: 135k) même quand elle tombe entre deux graduations.
  // Triées par position puis filtrées : quand deux valeurs distinctes tombent trop près l'une de
  // l'autre (ex: 3.5k et 3.3k en vue Mois, où il y a beaucoup plus de barres qu'en Semaine/Année),
  // on ne garde que la première rencontrée pour éviter que leurs libellés ne se chevauchent.
  const SEUIL_COLLISION_PX = 12
  const marqueursValeursReelles = [...new Set(revenusPeriode.filter(r => r.montant > 0).map(r => r.montant))]
    .map(montant => ({ montant, topPx: BAR_MAX_PX - (montant / plafondEchelle) * BAR_MAX_PX }))
    .sort((a, b) => a.topPx - b.topPx)
    .filter((m, i, arr) => i === 0 || m.topPx - arr[i - 1].topPx >= SEUIL_COLLISION_PX)

  // Une graduation ronde trop proche d'une valeur réelle (en pixels) est masquée pour éviter
  // que les deux libellés (ex: "150k" et "134.8k") ne se chevauchent visuellement.
  const graduationMasquee = (topPxGraduation) =>
    marqueursValeursReelles.some(m => Math.abs(m.topPx - topPxGraduation) < SEUIL_COLLISION_PX)
  const titrePeriode = periode === 'semaine'
    ? 'Revenus des 7 derniers jours'
    : periode === 'mois'
      ? `Revenus quotidiens — ${maintenant.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
      : `Revenus mensuels ${maintenant.getFullYear()}`

  const hotelsProCount = hotels.filter(h => h.statut !== 'rejete' && h.type_abonnement === 'pro').length
  const hotelsFreemiumCount = hotels.filter(h => h.statut !== 'rejete' && h.type_abonnement === 'freemium').length

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
            <div className="relative">
              <button onClick={() => setNotifOuverte(o => !o)}
                className="relative p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                <Bell size={18} className="text-gray-500" />
                {hotelsEnAttente.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {notifOuverte && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOuverte(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    </div>
                    {hotelsEnAttente.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <CheckCircle size={22} className="mx-auto mb-2 text-green-400" />
                        Rien de nouveau à traiter
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                        {hotelsEnAttente.slice(0, 5).map(h => (
                          <button key={h.id} onClick={() => { setNotifOuverte(false); navigate('/admin/hotels') }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                              <Clock size={14} className="text-amber-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">Nouvel hôtel à valider : {h.nom}</p>
                              <p className="text-xs text-gray-400 truncate">{h.gestionnaire_nom} · {h.ville}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { setNotifOuverte(false); navigate('/admin/hotels') }}
                      className="w-full text-center py-2.5 text-xs font-semibold text-blue-600 hover:bg-gray-50 border-t border-gray-50 rounded-b-2xl">
                      Voir la validation des hôtels
                    </button>
                  </div>
                </>
              )}
            </div>
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
              <h2 className="font-bold text-gray-900 capitalize">{titrePeriode} (commissions)</h2>
              <div className="flex items-center gap-3">
                {derniereMaj && (
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Mis à jour à {derniereMaj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
                <span className="text-xs text-gray-400">En FCFA</span>
              </div>
            </div>
            {revenusPeriode.every(r => r.montant === 0) ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Aucune donnée disponible</div>
            ) : (
              <div className="flex">
                {/* Axe vertical : graduations arrondies + valeurs réelles des barres (tout en vert) */}
                <div className="relative text-[10px] text-green-600 font-semibold text-right pr-2 h-36 w-12 shrink-0">
                  {graduationsY.map((v, i) => {
                    const topPx = (i / NB_GRADUATIONS) * BAR_MAX_PX
                    if (graduationMasquee(topPx)) return null
                    return (
                      <span key={i} className="absolute right-2 -translate-y-1/2 leading-none" style={{ top: `${topPx}px` }}>
                        {formatFCFA(v)}
                      </span>
                    )
                  })}
                  {marqueursValeursReelles.map((m, i) => (
                    <span
                      key={`reel-${i}`}
                      className="absolute right-2 -translate-y-1/2 text-green-700 font-extrabold leading-none bg-white px-0.5"
                      style={{ top: `${m.topPx}px` }}
                    >
                      {formatFCFA(m.montant)}
                    </span>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Zone de tracé : quadrillage horizontal + axes + barres */}
                  <div className="relative h-36 border-l border-b border-gray-200">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {graduationsY.map((_, i) => (
                        <div key={i} className="border-t border-gray-100 w-full first:border-transparent" />
                      ))}
                    </div>
                    {/* Lignes pointillées vertes : relient chaque valeur réelle à sa position exacte sur l'axe */}
                    <div className="absolute inset-0 pointer-events-none">
                      {marqueursValeursReelles.map((m, i) => (
                        <div key={i} className="absolute left-0 right-0 border-t border-dashed border-green-400" style={{ top: `${m.topPx}px` }} />
                      ))}
                    </div>
                    <div className={`relative flex items-end h-full pl-1.5 ${periode === 'mois' ? 'gap-0.5' : 'gap-3'}`}>
                      {revenusPeriode.map((r, i) => {
                        const hauteurBarre = (r.montant / plafondEchelle) * BAR_MAX_PX
                        return (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center min-w-0 h-full">
                            <div
                              className={`w-full rounded-t-md transition-all ${r.montant > 0 ? 'bg-blue-600' : 'bg-blue-100'}`}
                              style={{ height: `${Math.max(hauteurBarre, r.montant > 0 ? 2 : 0)}px` }}
                              title={`${r.label} : ${Number(r.montant).toLocaleString()} FCFA`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Axe horizontal : libellés (jours/mois) */}
                  <div className={`flex pl-1.5 mt-1.5 ${periode === 'mois' ? 'gap-0.5' : 'gap-3'}`}>
                    {revenusPeriode.map((r, i) => {
                      const afficherLabel = periode !== 'mois' || i % 5 === 0 || i === revenusPeriode.length - 1
                      return (
                        <div key={i} className="flex-1 text-center min-w-0">
                          <span className="text-[10px] font-medium text-gray-500">{afficherLabel ? r.label : ''}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
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

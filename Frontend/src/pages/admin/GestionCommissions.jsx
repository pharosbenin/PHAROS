import { useState, useEffect } from 'react'
import { TrendingUp, Hotel, CheckCircle, Clock, AlertCircle, Search, Crown, X, Check, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'

const TAUX_ACTUELS = [
  { type: 'FREEMIUM', taux: 3, description: 'Abonnement de base — accès aux fonctionnalités essentielles', couleur: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' },
  { type: 'PRO', taux: 5, description: 'Abonnement premium — visibilité maximale, badge partenaire', couleur: 'border-amber-300', badge: 'bg-amber-100 text-amber-700' },
]

const STATUT = {
  verse: { label: 'Versée', cls: 'bg-green-100 text-green-700' },
  calcule: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  litige: { label: 'Litige', cls: 'bg-red-100 text-red-500' },
}

export default function GestionCommissions() {
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [commissions, setCommissions] = useState([])
  const [demandes, setDemandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [traitementId, setTraitementId] = useState(null)
  const [modalRejet, setModalRejet] = useState(null)
  const [messageRejet, setMessageRejet] = useState('')

  const charger = () => {
    setChargement(true)
    Promise.all([
      api.get('/admin/commissions/').catch(() => ({ data: { commissions: [] } })),
      api.get('/admin/demandes-upgrade/?statut=en_attente').catch(() => ({ data: [] })),
    ]).then(([resComm, resDem]) => {
      setCommissions(resComm.data.commissions || [])
      setDemandes(resDem.data || [])
    }).finally(() => setChargement(false))
  }

  useEffect(() => { charger() }, [])

  const approuver = async (id) => {
    setTraitementId(id)
    try {
      await api.post(`/admin/demandes-upgrade/${id}/approuver/`)
      toast.success("Demande approuvée — l'hôtel est maintenant en Pro !")
      charger()
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'approbation")
    } finally {
      setTraitementId(null)
    }
  }

  const rejeter = async () => {
    if (!modalRejet) return
    setTraitementId(modalRejet)
    try {
      await api.post(`/admin/demandes-upgrade/${modalRejet}/rejeter/`, { message: messageRejet })
      toast.success('Demande rejetée.')
      setModalRejet(null)
      setMessageRejet('')
      charger()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors du rejet')
    } finally {
      setTraitementId(null)
    }
  }

  const filtres = commissions.filter(c => {
    const matchRecherche = (c.hotel_nom || '').toLowerCase().includes(recherche.toLowerCase())
    const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut
    return matchRecherche && matchStatut
  })

  const totalCommissions = commissions.reduce((s, c) => s + parseFloat(c.montant_commission || 0), 0)
  const totalVersees = commissions.filter(c => c.statut === 'verse').reduce((s, c) => s + parseFloat(c.montant_commission || 0), 0)
  const totalEnAttente = commissions.filter(c => c.statut === 'calcule').reduce((s, c) => s + parseFloat(c.montant_commission || 0), 0)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />
      <div className="flex-1 min-w-0 p-6 lg:p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des commissions</h1>
          <p className="text-gray-400 text-sm mt-0.5">Définissez les taux et suivez les paiements de commissions</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{totalCommissions.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">FCFA — Commissions totales</p>
          </div>
          <div className="bg-white rounded-2xl border border-green-200 p-5">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{totalVersees.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">FCFA — Commissions versées</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <Clock size={20} className="text-amber-600" />
            </div>
            <p className="text-2xl font-black text-gray-900">{totalEnAttente.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">FCFA — En attente de versement</p>
          </div>
        </div>

        {/* Demandes de passage en Pro */}
        <div className="bg-white rounded-2xl border border-amber-200 mb-8">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-100">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Crown size={16} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Demandes de passage en Pro</h2>
              <p className="text-xs text-gray-400">Ces hôteliers ont demandé à passer leur établissement en abonnement Pro</p>
            </div>
            {demandes.length > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {demandes.length}
              </span>
            )}
          </div>

          {chargement ? (
            <div className="flex items-center justify-center py-10">
              <Loader size={24} className="animate-spin text-amber-500" />
            </div>
          ) : demandes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Aucune demande en attente</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {demandes.map(d => (
                <div key={d.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <Hotel size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{d.hotel_nom}</p>
                      <p className="text-xs text-gray-400">{d.gestionnaire_nom} · {d.hotel_ville}</p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        Demandé le {new Date(d.date_demande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setModalRejet(d.id); setMessageRejet('') }}
                      disabled={traitementId === d.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-40">
                      <X size={13} /> Rejeter
                    </button>
                    <button
                      onClick={() => approuver(d.id)}
                      disabled={traitementId === d.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors disabled:opacity-40">
                      {traitementId === d.id ? <Loader size={13} className="animate-spin" /> : <Check size={13} />}
                      Approuver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Taux de commission */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-8">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Taux de commission par abonnement</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TAUX_ACTUELS.map(t => (
              <div key={t.type} className={`border-2 rounded-2xl p-5 ${t.couleur}`}>
                <div className="mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.badge}`}>{t.type}</span>
                </div>
                <p className="text-3xl font-black text-gray-900 mb-2">{t.taux}<span className="text-xl text-gray-400">%</span></p>
                <p className="text-xs text-gray-500">{t.description}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
              <strong>Note :</strong> La modification du taux s'applique uniquement aux nouvelles réservations.
            </div>
          </div>
        </div>

        {/* Historique des commissions */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-gray-50 gap-3">
            <h2 className="font-bold text-gray-900">Historique des commissions</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                />
              </div>
              {['tous', 'verse', 'calcule'].map(s => (
                <button key={s} onClick={() => setFiltreStatut(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filtreStatut === s ? 'bg-blue-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                  {s === 'tous' ? 'Tous' : STATUT[s]?.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hôtel</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Montant brut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtres.map(c => {
                  const s = STATUT[c.statut] || STATUT['en_attente']
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800 text-xs">{c.hotel_nom}</p>
                        <p className="text-gray-400 text-xs font-mono">{c.reservation_numero}</p>
                      </td>
                      <td className="px-4 py-4 text-right hidden lg:table-cell">
                        <span className="text-sm text-gray-700">{parseFloat(c.montant_brut || 0).toLocaleString()} <span className="text-xs text-gray-400">FCFA</span></span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-bold text-blue-700">{parseFloat(c.montant_commission || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span></span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs text-gray-400">{new Date(c.date_calcul).toLocaleDateString('fr-FR')}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtres.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">Aucune commission trouvée</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal rejet */}
      {modalRejet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">Rejeter la demande</h3>
            <p className="text-sm text-gray-500 mb-4">Vous pouvez laisser un message optionnel au gestionnaire.</p>
            <textarea
              value={messageRejet}
              onChange={e => setMessageRejet(e.target.value)}
              placeholder="Motif du rejet (optionnel)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setModalRejet(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={rejeter} disabled={traitementId === modalRejet}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {traitementId === modalRejet ? <Loader size={14} className="animate-spin" /> : <X size={14} />}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

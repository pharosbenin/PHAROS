import { useState, useEffect } from 'react'
import { Search, Users, Hotel, UserCheck, UserX, Mail, Phone, Calendar, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'

const STATUT = {
  actif: { label: 'Actif', cls: 'bg-green-100 text-green-700' },
  suspendu: { label: 'Suspendu', cls: 'bg-red-100 text-red-500' },
}

export default function GestionUtilisateurs() {
  const [onglet, setOnglet] = useState('clients')
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [clients, setClients] = useState([])
  const [gestionnaires, setGestionnaires] = useState([])
  const [chargement, setChargement] = useState(true)
  const [confirmer, setConfirmer] = useState(null)
  const [traitementId, setTraitementId] = useState(null)

  const charger = () => {
    setChargement(true)
    Promise.all([
      api.get('/admin/utilisateurs/?role=client'),
      api.get('/admin/utilisateurs/?role=gestionnaire'),
    ]).then(([resC, resG]) => {
      setClients(resC.data || [])
      setGestionnaires(resG.data || [])
    }).catch(() => toast.error('Erreur lors du chargement des utilisateurs'))
      .finally(() => setChargement(false))
  }

  useEffect(() => { charger() }, [])

  const liste = onglet === 'clients' ? clients : gestionnaires

  const filtres = liste.filter(u => {
    const nom = u.nom_complet || u.username || ''
    const matchRecherche = nom.toLowerCase().includes(recherche.toLowerCase()) ||
      u.email.toLowerCase().includes(recherche.toLowerCase())
    const matchStatut = filtreStatut === 'tous' || u.statut === filtreStatut
    return matchRecherche && matchStatut
  })

  const toggleSuspension = async (u) => {
    setTraitementId(u.id)
    try {
      const res = await api.post(`/admin/utilisateurs/${u.id}/suspendre/`)
      toast.success(res.data.message)
      charger()
    } catch {
      toast.error("Erreur lors de l'opération")
    } finally {
      setTraitementId(null)
      setConfirmer(null)
    }
  }

  const clientsActifs = clients.filter(c => c.statut === 'actif').length
  const gestionnairesActifs = gestionnaires.filter(g => g.statut === 'actif').length
  const suspendus = [...clients, ...gestionnaires].filter(u => u.statut === 'suspendu').length
  const total = clients.length + gestionnaires.length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />

      <div className="flex-1 min-w-0 p-6 lg:p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gérez les comptes clients et hôteliers de la plateforme</p>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Clients actifs', valeur: clientsActifs, icon: Users, couleur: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Hôteliers actifs', valeur: gestionnairesActifs, icon: Hotel, couleur: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Comptes suspendus', valeur: suspendus, icon: UserX, couleur: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Total utilisateurs', valeur: total, icon: UserCheck, couleur: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <s.icon size={17} className={s.couleur} />
              </div>
              <p className="text-xl font-black text-gray-900">{chargement ? '—' : s.valeur}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'clients', label: 'Clients', count: clients.length },
            { key: 'gestionnaires', label: 'Hôteliers', count: gestionnaires.length },
          ].map(o => (
            <button key={o.key} onClick={() => { setOnglet(o.key); setFiltreStatut('tous'); setRecherche('') }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${onglet === o.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {o.label}
              <span className={`text-xs px-1.5 rounded-full font-bold ${onglet === o.key ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{o.count}</span>
            </button>
          ))}
        </div>

        {/* Barre de recherche + filtre statut */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['tous', 'actif', 'suspendu'].map(s => (
              <button key={s} onClick={() => setFiltreStatut(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${filtreStatut === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {s === 'tous' ? 'Tous' : STATUT[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {chargement ? (
            <div className="flex items-center justify-center py-16">
              <Loader size={28} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/80">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                      {onglet === 'gestionnaires' && (
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Hôtel</th>
                      )}
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtres.map(u => {
                      const nom = u.nom_complet || u.username
                      const s = STATUT[u.statut] || STATUT['actif']
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-blue-600">{nom.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{nom}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar size={10} />{new Date(u.date_joined).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell">
                            <p className="text-gray-600 flex items-center gap-1 text-xs"><Mail size={11} />{u.email}</p>
                            {u.telephone && (
                              <p className="text-gray-400 flex items-center gap-1 text-xs mt-0.5"><Phone size={11} />{u.telephone}</p>
                            )}
                          </td>
                          {onglet === 'gestionnaires' && (
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <p className="text-gray-700 text-xs font-medium">{u.hotel_nom || '—'}</p>
                              {u.type_abonnement && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${u.type_abonnement === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {u.type_abonnement.toUpperCase()}
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {u.statut === 'actif' ? (
                              <button
                                onClick={() => setConfirmer({ user: u, action: 'suspendre' })}
                                disabled={traitementId === u.id}
                                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                                Suspendre
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmer({ user: u, action: 'reactiver' })}
                                disabled={traitementId === u.id}
                                className="text-xs text-green-600 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-40">
                                Réactiver
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filtres.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">Aucun utilisateur trouvé</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal confirmation */}
        {confirmer && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmer.action === 'suspendre' ? 'bg-red-50' : 'bg-green-50'}`}>
                {confirmer.action === 'suspendre'
                  ? <UserX size={24} className="text-red-500" />
                  : <UserCheck size={24} className="text-green-600" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                {confirmer.action === 'suspendre' ? 'Suspendre ce compte ?' : 'Réactiver ce compte ?'}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                <strong>{confirmer.user.nom_complet}</strong> sera {confirmer.action === 'suspendre'
                  ? 'immédiatement bloqué et ne pourra plus accéder à la plateforme.'
                  : 'réactivé et pourra à nouveau utiliser la plateforme.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmer(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  onClick={() => toggleSuspension(confirmer.user)}
                  disabled={traitementId === confirmer.user.id}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 ${confirmer.action === 'suspendre' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-60`}>
                  {traitementId === confirmer.user.id
                    ? <Loader size={14} className="animate-spin" />
                    : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

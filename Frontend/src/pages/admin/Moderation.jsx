import { useState } from 'react'
import { ShieldAlert, Star, Flag, Trash2, CheckCircle, AlertTriangle, MessageSquare, Search, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'
import usePolling from '../../hooks/usePolling'

const STATUT_AVIS = {
  true: { label: 'Approuvé', cls: 'bg-green-100 text-green-700' },
  false: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
}

export default function Moderation() {
  const [onglet, setOnglet] = useState('signalements')
  const [recherche, setRecherche] = useState('')
  const [signalements, setSignalements] = useState([])
  const [avisAttente, setAvisAttente] = useState([])
  const [signalementsContenu, setSignalementsContenu] = useState([])
  const [signalementsHotel, setSignalementsHotel] = useState([])
  const [chargement, setChargement] = useState(true)
  const [confirmer, setConfirmer] = useState(null)
  const [traitementId, setTraitementId] = useState(null)

  const charger = () => {
    setChargement(true)
    Promise.all([
      api.get('/admin/signalements/').catch(() => ({ data: [] })),
      api.get('/admin/avis/?approuve=false').catch(() => ({ data: [] })),
      api.get('/admin/signalements/contenu/').catch(() => ({ data: [] })),
      api.get('/admin/signalements/hotel/').catch(() => ({ data: [] })),
    ]).then(([resS, resA, resC, resH]) => {
      setSignalements(resS.data || [])
      setAvisAttente(resA.data || [])
      setSignalementsContenu(resC.data || [])
      setSignalementsHotel(resH.data || [])
    }).finally(() => setChargement(false))
  }

  usePolling(charger, 30000)

  const signalementsFiltre = signalements.filter(s =>
    (s.avis_client_nom || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (s.hotel_nom || '').toLowerCase().includes(recherche.toLowerCase())
  )

  const avisFiltre = avisAttente.filter(a =>
    (a.client_nom || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (a.hotel_nom || '').toLowerCase().includes(recherche.toLowerCase())
  )

  const traiterSignalementContenu = async (id) => {
    setTraitementId(id)
    try {
      await api.post(`/admin/signalements/contenu/${id}/traiter/`)
      toast.success('Signalement traité.')
      charger()
    } catch { toast.error('Erreur') } finally { setTraitementId(null) }
  }

  const traiterSignalementHotel = async (id) => {
    setTraitementId(id)
    try {
      await api.post(`/admin/signalements/hotel/${id}/traiter/`)
      toast.success('Signalement traité.')
      charger()
    } catch { toast.error('Erreur') } finally { setTraitementId(null) }
  }

  const conserverSignalement = async (id) => {
    setTraitementId(id)
    try {
      await api.post(`/admin/signalements/${id}/traiter/`)
      toast.success('Signalement clôturé — avis conservé.')
      charger()
    } catch {
      toast.error('Erreur lors du traitement')
    } finally {
      setTraitementId(null)
      setConfirmer(null)
    }
  }

  const supprimerAvis = async (avisId) => {
    setTraitementId(avisId)
    try {
      await api.delete(`/admin/avis/${avisId}/supprimer/`)
      toast.success('Avis supprimé.')
      charger()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setTraitementId(null)
      setConfirmer(null)
    }
  }

  const approuverAvis = async (id) => {
    setTraitementId(id)
    try {
      await api.post(`/admin/avis/${id}/approuver/`)
      toast.success('Avis approuvé et publié !')
      charger()
    } catch {
      toast.error("Erreur lors de l'approbation")
    } finally {
      setTraitementId(null)
      setConfirmer(null)
    }
  }

  const nbSignalements = signalements.length
  const nbAvisAttente = avisAttente.length
  const nbContenu = signalementsContenu.length
  const nbHotel = signalementsHotel.length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />

      <div className="flex-1 min-w-0 p-6 lg:p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Modération</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gérez les avis signalés et les avis en attente d'approbation</p>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Avis signalés', valeur: nbSignalements, icon: Flag, couleur: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Mots interdits', valeur: nbContenu, icon: ShieldAlert, couleur: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Signalements hôtel', valeur: nbHotel, icon: AlertTriangle, couleur: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Avis à approuver', valeur: nbAvisAttente, icon: CheckCircle, couleur: 'text-blue-600', bg: 'bg-blue-50' },
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

        {/* Onglets + recherche */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'signalements', label: 'Avis signalés', count: nbSignalements },
              { key: 'contenu', label: 'Mots interdits', count: nbContenu },
              { key: 'hotel', label: 'Signalements hôtel', count: nbHotel },
              { key: 'attente', label: 'À approuver', count: nbAvisAttente },
            ].map(o => (
              <button key={o.key} onClick={() => setOnglet(o.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${onglet === o.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {o.label}
                {o.count > 0 && (
                  <span className={`text-xs px-1.5 rounded-full font-bold ${onglet === o.key ? 'bg-white text-blue-600' : 'bg-red-100 text-red-600'}`}>{o.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto max-w-xs w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={recherche} onChange={e => setRecherche(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Onglet signalements */}
            {onglet === 'signalements' && (
              <div className="space-y-4">
                {signalementsFiltre.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-800 text-sm">{s.avis_client_nom}</span>
                          <span className="text-xs text-gray-400">sur</span>
                          <span className="text-sm font-medium text-blue-700">{s.hotel_nom}</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={11} className={i < s.avis_note ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                            ))}
                          </div>
                        </div>
                        {s.avis_commentaire && (
                          <p className="text-sm text-gray-600 mb-2">"{s.avis_commentaire}"</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1"><Flag size={11} />Signalé par : {s.signale_par_nom}</span>
                          <span>Motif : <strong className="text-gray-600">{s.motif_display || s.motif}</strong></span>
                          {s.description && <span>{s.description}</span>}
                          <span>{new Date(s.date_signalement).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setConfirmer({ type: 'conserver', id: s.id })}
                          disabled={traitementId === s.id}
                          className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-40">
                          <CheckCircle size={13} /> Conserver
                        </button>
                        <button
                          onClick={() => setConfirmer({ type: 'supprimer_signal', id: s.id, avisId: s.avis_id })}
                          disabled={traitementId === s.id}
                          className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-500 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40">
                          <Trash2 size={13} /> Supprimer l'avis
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {signalementsFiltre.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                    <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun avis signalé en attente</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet mots interdits */}
            {onglet === 'contenu' && (
              <div className="space-y-4">
                {signalementsContenu.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-orange-100 p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-semibold text-gray-800 text-sm">{s.client_nom}</span>
                          <span className="text-xs text-gray-400">sur</span>
                          <span className="text-sm font-medium text-blue-700">{s.hotel_nom}</span>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Mots interdits</span>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-2">
                          <p className="text-xs font-semibold text-red-600 mb-1">Commentaire original</p>
                          <p className="text-sm text-gray-700">"{s.avis_initial}"</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Explication du client</p>
                          <p className="text-sm text-gray-600">{s.explication}</p>
                        </div>
                        <p className="text-xs text-gray-300 mt-2">{new Date(s.date_signalement).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <button onClick={() => traiterSignalementContenu(s.id)} disabled={traitementId === s.id}
                        className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-40 shrink-0">
                        <CheckCircle size={13} /> Traité
                      </button>
                    </div>
                  </div>
                ))}
                {signalementsContenu.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                    <CheckCircle size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun commentaire avec mots interdits en attente</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet signalements hôtel */}
            {onglet === 'hotel' && (
              <div className="space-y-4">
                {signalementsHotel.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-red-100 p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-semibold text-gray-800 text-sm">{s.client_nom}</span>
                          <span className="text-xs text-gray-400">signale</span>
                          <span className="text-sm font-medium text-blue-700">{s.hotel_nom}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{s.motif_display}</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{s.description}</p>
                        <p className="text-xs text-gray-300 mt-2">{new Date(s.date_signalement).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <button onClick={() => traiterSignalementHotel(s.id)} disabled={traitementId === s.id}
                        className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-40 shrink-0">
                        <CheckCircle size={13} /> Traité
                      </button>
                    </div>
                  </div>
                ))}
                {signalementsHotel.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                    <CheckCircle size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun signalement d'hôtel en attente</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet avis à approuver */}
            {onglet === 'attente' && (
              <div className="space-y-4">
                {avisFiltre.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-800 text-sm">{a.client_nom}</span>
                          <span className="text-xs text-gray-400">sur</span>
                          <span className="text-sm font-medium text-blue-700">{a.hotel_nom || `Hôtel #${a.hotel}`}</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={11} className={i < a.note ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                            ))}
                          </div>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">En attente</span>
                        </div>
                        {a.commentaire && <p className="text-sm text-gray-600 mb-2">"{a.commentaire}"</p>}
                        <p className="text-xs text-gray-400">{new Date(a.date_avis).toLocaleDateString('fr-FR')}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setConfirmer({ type: 'approuver', id: a.id })}
                          disabled={traitementId === a.id}
                          className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-40">
                          <CheckCircle size={13} /> Approuver
                        </button>
                        <button
                          onClick={() => setConfirmer({ type: 'supprimer_avis', id: a.id })}
                          disabled={traitementId === a.id}
                          className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 text-red-500 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40">
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {avisFiltre.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                    <CheckCircle size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun avis en attente d'approbation</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal confirmation */}
        {confirmer && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmer.type === 'conserver' || confirmer.type === 'approuver' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {confirmer.type === 'conserver' || confirmer.type === 'approuver'
                  ? <CheckCircle size={22} className="text-green-600" />
                  : <Trash2 size={22} className="text-red-500" />}
              </div>
              <h3 className="text-base font-bold text-gray-900 text-center mb-2">
                {confirmer.type === 'conserver' && 'Conserver cet avis ?'}
                {confirmer.type === 'approuver' && 'Approuver cet avis ?'}
                {(confirmer.type === 'supprimer_signal' || confirmer.type === 'supprimer_avis') && 'Supprimer cet avis ?'}
              </h3>
              <p className="text-xs text-gray-400 text-center mb-6">
                {confirmer.type === 'conserver' && "Le signalement sera clôturé et l'avis restera visible."}
                {confirmer.type === 'approuver' && "L'avis sera publié et visible par tous les visiteurs."}
                {(confirmer.type === 'supprimer_signal' || confirmer.type === 'supprimer_avis') && "L'avis sera définitivement supprimé."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmer(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  disabled={traitementId !== null}
                  onClick={() => {
                    if (confirmer.type === 'conserver') conserverSignalement(confirmer.id)
                    if (confirmer.type === 'approuver') approuverAvis(confirmer.id)
                    if (confirmer.type === 'supprimer_signal') supprimerAvis(confirmer.avisId)
                    if (confirmer.type === 'supprimer_avis') supprimerAvis(confirmer.id)
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 ${
                    confirmer.type === 'conserver' || confirmer.type === 'approuver'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}>
                  {traitementId !== null ? <Loader size={14} className="animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

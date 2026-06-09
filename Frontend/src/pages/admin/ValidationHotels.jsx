import { useState, useEffect } from 'react'
import { Search, CheckCircle, XCircle, Clock, Phone, MapPin, ChevronDown, ChevronUp, Building2, Loader, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'

const STATUT = {
  en_attente: { label: 'En attente', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  valide: { label: 'Validé', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejete: { label: 'Rejeté', cls: 'bg-red-100 text-red-500', dot: 'bg-red-500' },
  suspendu: { label: 'Suspendu', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

export default function ValidationHotels() {
  const [filtre, setFiltre] = useState('en_attente')
  const [recherche, setRecherche] = useState('')
  const [hotels, setHotels] = useState([])
  const [chargement, setChargement] = useState(true)
  const [ouvert, setOuvert] = useState(null)
  const [confirmer, setConfirmer] = useState(null)
  const [motifRejet, setMotifRejet] = useState('')
  const [traitementId, setTraitementId] = useState(null)

  const charger = () => {
    setChargement(true)
    api.get('/admin/hotels/')
      .then(res => setHotels(res.data || []))
      .catch(() => toast.error('Erreur lors du chargement des hôtels'))
      .finally(() => setChargement(false))
  }

  useEffect(() => { charger() }, [])

  const hotelsFiltres = hotels.filter(h => {
    const matchStatut = filtre === 'tous' || h.statut === filtre
    const matchRecherche = h.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (h.ville || '').toLowerCase().includes(recherche.toLowerCase())
    return matchStatut && matchRecherche
  })

  const nbAttente = hotels.filter(h => h.statut === 'en_attente').length

  const valider = async (id) => {
    setTraitementId(id)
    try {
      await api.post(`/admin/hotels/${id}/valider/`)
      toast.success('Hôtel validé avec succès !')
      charger()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la validation')
    } finally {
      setTraitementId(null)
      setConfirmer(null)
    }
  }

  const rejeter = async (id) => {
    setTraitementId(id)
    try {
      await api.post(`/admin/hotels/${id}/rejeter/`, { motif: motifRejet })
      toast.success('Hôtel rejeté.')
      charger()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors du rejet')
    } finally {
      setTraitementId(null)
      setConfirmer(null)
      setMotifRejet('')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />

      <div className="flex-1 min-w-0 p-6 lg:p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Validation des hôtels</h1>
          <p className="text-gray-400 text-sm mt-0.5">Examinez les dossiers soumis et validez ou rejetez les inscriptions</p>
        </div>

        {/* Filtres + recherche */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un hôtel ou une ville..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'en_attente', label: 'En attente', count: nbAttente },
              { key: 'valide', label: 'Validés', count: null },
              { key: 'rejete', label: 'Rejetés', count: null },
              { key: 'tous', label: 'Tous', count: null },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltre(f.key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filtre === f.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {f.label}
                {f.count !== null && (
                  <span className={`text-xs font-bold px-1.5 rounded-full ${filtre === f.key ? 'bg-white text-blue-600' : 'bg-amber-100 text-amber-700'}`}>{f.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {chargement ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {hotelsFiltres.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-gray-400 text-sm">Aucun hôtel trouvé</p>
              </div>
            )}

            {hotelsFiltres.map(h => {
              const s = STATUT[h.statut] || STATUT['en_attente']
              const estOuvert = ouvert === h.id
              return (
                <div key={h.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

                  {/* En-tête de la carte */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={22} className="text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900">{h.nom}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                          {h.type_abonnement === 'pro' && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">PRO</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                          {h.quartier && <span className="flex items-center gap-1"><MapPin size={11} />{h.quartier}, {h.ville}</span>}
                          {h.telephone && <span className="flex items-center gap-1"><Phone size={11} />{h.telephone}</span>}
                          <span className="flex items-center gap-1"><Clock size={11} />Soumis le {new Date(h.date_creation).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {h.statut === 'en_attente' && (
                        <>
                          <button
                            onClick={() => setConfirmer({ id: h.id, action: 'valider', nom: h.nom })}
                            className="flex items-center gap-1.5 bg-green-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            <CheckCircle size={14} /> Valider
                          </button>
                          <button
                            onClick={() => { setConfirmer({ id: h.id, action: 'rejeter', nom: h.nom }); setMotifRejet('') }}
                            className="flex items-center gap-1.5 bg-red-50 text-red-500 border border-red-200 text-xs px-3 py-2 rounded-lg hover:bg-red-100 transition-colors">
                            <XCircle size={14} /> Rejeter
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setOuvert(estOuvert ? null : h.id)}
                        className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                        {estOuvert ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Détails dépliants */}
                  {estOuvert && (
                    <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Infos dossier */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informations du dossier</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex gap-2">
                              <span className="text-gray-400 w-24 shrink-0">Gérant :</span>
                              <span className="text-gray-800 font-medium">{h.gestionnaire_nom || '—'}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-400 w-24 shrink-0">Email :</span>
                              <span className="text-gray-800">{h.gestionnaire_email || h.email || '—'}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-400 w-24 shrink-0">Téléphone :</span>
                              <span className="text-gray-800">{h.gestionnaire_telephone || h.telephone || '—'}</span>
                            </div>
                            {h.description && (
                              <div className="flex gap-2">
                                <span className="text-gray-400 w-24 shrink-0">Description :</span>
                                <span className="text-gray-700 text-xs">{h.description}</span>
                              </div>
                            )}
                            {h.motif_rejet && (
                              <div className="flex gap-2">
                                <span className="text-gray-400 w-24 shrink-0">Motif rejet :</span>
                                <span className="text-red-600 text-xs font-medium">{h.motif_rejet}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Documents */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Documents</p>
                          {h.document_registre ? (
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <CheckCircle size={14} className="text-green-500 shrink-0" />
                              <span>Document registre</span>
                              <a
                                href={h.document_registre?.startsWith('http') ? h.document_registre : `http://localhost:8000${h.document_registre}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <FileText size={11} /> Voir
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-red-500">
                              <XCircle size={14} className="text-red-400 shrink-0" />
                              <span>Aucun document fourni</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Modal confirmation valider */}
        {confirmer?.action === 'valider' && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Valider cet hôtel ?</h3>
              <p className="text-sm text-gray-500 text-center mb-2">
                <strong>{confirmer.nom}</strong>
              </p>
              <p className="text-sm text-gray-500 text-center mb-6">
                L'hôtelier pourra commencer à gérer son établissement.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmer(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  onClick={() => valider(confirmer.id)}
                  disabled={traitementId === confirmer.id}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60">
                  {traitementId === confirmer.id ? <Loader size={14} className="animate-spin" /> : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal confirmation rejeter */}
        {confirmer?.action === 'rejeter' && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Rejeter cet hôtel ?</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                <strong>{confirmer.nom}</strong>
              </p>
              <textarea
                value={motifRejet}
                onChange={e => setMotifRejet(e.target.value)}
                placeholder="Motif du rejet (optionnel)..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 mb-4 resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setConfirmer(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  onClick={() => rejeter(confirmer.id)}
                  disabled={traitementId === confirmer.id}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60">
                  {traitementId === confirmer.id ? <Loader size={14} className="animate-spin" /> : 'Confirmer le rejet'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

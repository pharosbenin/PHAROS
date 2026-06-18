import { useState, useEffect } from 'react'
import { Search, CheckCircle, Clock, XCircle, Eye, Phone, Mail, X, AlertCircle, Banknote, Loader } from 'lucide-react'
import SidebarHotelier from '../../components/common/SidebarHotelier'
import { useHotelActif } from '../../context/HotelActifContext'
import api from '../../services/api'
import usePolling from '../../hooks/usePolling'

const STATUTS = {
  en_attente:     { label: 'En attente',    cls: 'bg-amber-100 text-amber-700',   icon: Clock },
  payee:          { label: 'Payée',          cls: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
  confirmee:      { label: 'Confirmée',      cls: 'bg-green-100 text-green-700',   icon: CheckCircle },
  en_cours:       { label: 'En cours',       cls: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  confirme_client:{ label: 'Client confirmé',cls: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  confirme_hotel: { label: 'Hôtel confirmé', cls: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
  terminee:       { label: 'Terminée',       cls: 'bg-gray-100 text-gray-600',     icon: CheckCircle },
  annulee:        { label: 'Annulée',        cls: 'bg-red-100 text-red-500',       icon: XCircle },
  remboursee:     { label: 'Remboursée',     cls: 'bg-orange-100 text-orange-600', icon: XCircle },
}

const STATUTS_ACTIFS = ['payee', 'confirmee', 'en_cours', 'confirme_client', 'confirme_hotel']
const PEUT_CONFIRMER = ['payee', 'confirmee', 'en_cours', 'confirme_client']

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default function GestionReservations() {
  const { hotelActif } = useHotelActif()
  const [reservations, setReservations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [detail, setDetail] = useState(null)
  const [notif, setNotif] = useState(null)
  const [enConfirmation, setEnConfirmation] = useState(false)
  const [hotel, setHotel] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [voirNotifs, setVoirNotifs] = useState(false)

  const charger = async () => {
    try {
      const [resRes, resNotifs] = await Promise.all([
        api.get('/gestionnaire/reservations/'),
        api.get('/notifications/'),
      ])
      setHotel(hotelActif)
      setReservations(hotelActif
        ? resRes.data.filter(r => r.hotel_id === hotelActif.id)
        : resRes.data)
      setNotifications(resNotifs.data)
    } catch (err) {
      console.error('Erreur chargement réservations', err)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    if (hotelActif) charger()
  }, [hotelActif?.id])

  usePolling(charger, 30000)

  const marquerNotifLue = async (id) => {
    await api.patch(`/notifications/${id}/lire/`).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  const afficherNotif = (msg) => {
    setNotif(msg)
    setTimeout(() => setNotif(null), 4000)
  }

  const confirmerSejour = async (reservation) => {
    setEnConfirmation(true)
    try {
      const res = await api.post(`/reservations/${reservation.numero}/confirmer-sejour-hotel/`)
      const nouveauStatut = res.data.statut
      setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, statut: nouveauStatut } : r))
      if (detail) setDetail(prev => ({ ...prev, statut: nouveauStatut }))
      if (nouveauStatut === 'terminee') {
        afficherNotif('Séjour confirmé ! Les fonds Escrow vont être transférés sur votre compte.')
      } else {
        afficherNotif('Confirmation enregistrée. En attente de la confirmation du client.')
      }
    } catch (err) {
      afficherNotif(err.response?.data?.detail || 'Erreur lors de la confirmation')
    } finally {
      setEnConfirmation(false)
    }
  }

  const taux = hotel?.type_abonnement === 'pro' ? 5 : 3

  const reservationsFiltrees = reservations
    .filter(r => r.statut !== 'en_attente')
    .filter(r => filtreStatut === 'tous' || r.statut === filtreStatut)
    .filter(r => {
      if (!recherche) return true
      const q = recherche.toLowerCase()
      return (
        `${r.prenom_client} ${r.nom_client}`.toLowerCase().includes(q) ||
        r.numero.toLowerCase().includes(q) ||
        (r.type_chambre_nom || '').toLowerCase().includes(q)
      )
    })

  const nbAConfirmer = reservations.filter(r => PEUT_CONFIRMER.includes(r.statut)).length
  const escrowTotal = reservations.reduce((sum, r) => {
    if (['annulee', 'remboursee'].includes(r.statut)) {
      return sum + parseFloat(r.annulation_info?.hotel_recoit || 0)
    }
    return sum + parseFloat(r.prix_total || 0) * (1 - taux / 100)
  }, 0)

  if (chargement) return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 flex items-center justify-center"><Loader size={32} className="animate-spin text-blue-500" /></div>
    </div>
  )

  const detailReserv = detail

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 min-w-0 p-6 lg:p-8">

        {notif && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm">
            <CheckCircle size={16} /> {notif}
          </div>
        )}

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
            <p className="text-gray-400 text-sm mt-0.5">Gérez toutes les réservations de votre établissement</p>
          </div>
          {/* Cloche notifications */}
          <div className="relative">
            <button onClick={() => setVoirNotifs(v => !v)}
              className="relative p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <AlertCircle size={20} className="text-gray-600" />
              {notifications.filter(n => !n.lu).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {notifications.filter(n => !n.lu).length}
                </span>
              )}
            </button>
            {voirNotifs && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-bold text-gray-900 text-sm">Notifications</p>
                  <button onClick={() => setVoirNotifs(false)}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Aucune notification</p>
                  ) : notifications.map(n => (
                    <div key={n.id} onClick={() => marquerNotifLue(n.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.lu ? 'bg-red-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.lu ? 'bg-red-500' : 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${!n.lu ? 'text-red-700' : 'text-gray-700'}`}>{n.titre}</p>
                          <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{n.message}</p>
                          <p className="text-xs text-gray-300 mt-1">{new Date(n.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {nbAConfirmer > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-800 text-sm">{nbAConfirmer} séjour{nbAConfirmer > 1 ? 's' : ''} en attente de votre confirmation</p>
              <p className="text-xs text-purple-600 mt-0.5">Confirmez les séjours terminés pour déclencher le transfert des fonds Escrow vers votre compte.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', valeur: reservations.length, couleur: 'text-gray-800' },
            { label: 'Actives', valeur: reservations.filter(r => STATUTS_ACTIFS.includes(r.statut)).length, couleur: 'text-green-600' },
            { label: 'Escrow total', valeur: Math.round(escrowTotal).toLocaleString('fr-FR') + ' FCFA', couleur: 'text-blue-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className={`text-xl font-black ${s.couleur}`}>{s.valeur}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher client, N° réservation..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'tous', label: 'Toutes' },
              { val: 'payee', label: 'Payées' },
              { val: 'confirmee', label: 'Confirmées' },
              { val: 'en_cours', label: 'En cours' },
              { val: 'confirme_client', label: 'Client confirmé' },
              { val: 'terminee', label: 'Terminées' },
              { val: 'annulee', label: 'Annulées' },
            ].map(f => (
              <button key={f.val} onClick={() => setFiltreStatut(f.val)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${filtreStatut === f.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3">N° Réservation</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Chambre</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Dates</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Escrow</th>
                  <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3">Statut</th>
                  <th className="text-center text-xs font-semibold text-gray-400 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservationsFiltrees.map(r => {
                  const s = STATUTS[r.statut] ?? { label: r.statut, cls: 'bg-gray-100 text-gray-600', icon: Clock }
                  const IconeS = s.icon
                  const montant = parseFloat(r.prix_total || 0)
                  const commission = Math.round(montant * taux / 100)
                  const escrow = montant - commission
                  const estAnnulee = r.statut === 'annulee' || r.statut === 'remboursee'
                  const hotelRecoit = r.annulation_info ? r.annulation_info.hotel_recoit : 0
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-xs font-mono text-gray-500">{String(r.numero).slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-300 mt-0.5">{formatDate(r.date_creation)}</p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-sm font-medium text-gray-800">{r.prenom_client} {r.nom_client}</p>
                        <p className="text-xs text-gray-400">{r.nb_adultes} voyageur{r.nb_adultes > 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-3 py-4"><p className="text-sm text-gray-600">{r.type_chambre_nom}</p></td>
                      <td className="px-3 py-4">
                        <p className="text-xs text-gray-600">{formatDate(r.date_arrivee)}</p>
                        <p className="text-xs text-gray-400">{formatDate(r.date_depart)} · {r.nb_nuits} nuit{r.nb_nuits > 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-3 py-4 text-right">
                        {estAnnulee ? (
                          r.annulation_info ? (
                            <>
                              <p className="font-bold text-red-600 text-sm">{Math.round(hotelRecoit).toLocaleString('fr-FR')}</p>
                              <p className="text-xs text-red-300">FCFA retenus</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-gray-300 text-sm">—</p>
                              <p className="text-xs text-gray-300">Annulée</p>
                            </>
                          )
                        ) : (
                          <>
                            <p className="font-bold text-gray-800 text-sm">{escrow.toLocaleString('fr-FR')}</p>
                            <p className="text-xs text-gray-300">FCFA</p>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>
                          <IconeS size={10} /> {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setDetail(r)}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye size={15} />
                          </button>
                          {PEUT_CONFIRMER.includes(r.statut) && (
                            <button onClick={() => confirmerSejour(r)} disabled={enConfirmation}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                              <CheckCircle size={12} /> Confirmer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {reservationsFiltrees.length === 0 && (
              <div className="p-10 text-center text-gray-400"><p className="text-sm">Aucune réservation trouvée</p></div>
            )}
          </div>
        </div>

        {detailReserv && (() => {
          const montant = parseFloat(detailReserv.prix_total || 0)
          const commission = Math.round(montant * taux / 100)
          const escrow = montant - commission
          const s = STATUTS[detailReserv.statut] ?? { label: detailReserv.statut, cls: 'bg-gray-100 text-gray-600', icon: Clock }
          const peutConfirmer = PEUT_CONFIRMER.includes(detailReserv.statut)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <h2 className="font-bold text-gray-900">Détail réservation</h2>
                    <p className="text-xs text-gray-400 font-mono">{String(detailReserv.numero).toUpperCase()}</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
                </div>
                <div className="p-6 space-y-5">

                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${s.cls}`}>
                    {(() => { const I = s.icon; return <I size={16} /> })()}
                    <span className="font-semibold text-sm">{s.label}</span>
                  </div>

                  {peutConfirmer && (
                    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${detailReserv.statut === 'confirme_client' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <p className="text-xs font-medium">
                        {detailReserv.statut === 'confirme_client'
                          ? 'Le client a confirmé son séjour. Votre confirmation libérera immédiatement les fonds Escrow vers votre compte.'
                          : 'Ce séjour est en cours. Confirmez-le pour initier la libération des fonds Escrow.'}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Client</h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-gray-800">{detailReserv.prenom_client} {detailReserv.nom_client}</p>
                      <div className="flex items-center gap-2 text-gray-500"><Mail size={13} /> {detailReserv.email_client}</div>
                      {detailReserv.telephone_client && <div className="flex items-center gap-2 text-gray-500"><Phone size={13} /> {detailReserv.telephone_client}</div>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Séjour</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Chambre</span><span className="font-medium">{detailReserv.type_chambre_nom}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Arrivée</span><span className="font-medium">{formatDate(detailReserv.date_arrivee)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Départ</span><span className="font-medium">{formatDate(detailReserv.date_depart)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Durée</span><span className="font-medium">{detailReserv.nb_nuits} nuit{detailReserv.nb_nuits > 1 ? 's' : ''}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Voyageurs</span><span className="font-medium">{detailReserv.nb_adultes}</span></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Paiement & Escrow</h3>
                    {(detailReserv.statut === 'annulee' || detailReserv.statut === 'remboursee') && detailReserv.annulation_info ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Détail annulation</p>
                        <div className="flex justify-between text-gray-600">
                          <span>Montant initial</span>
                          <span className="font-semibold">{montant.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Remboursé au client</span>
                          <span className="text-red-600 font-medium">−{Math.round(detailReserv.annulation_info.montant_rembourse).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="border-t border-red-100 pt-2 space-y-1.5">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Frais retenus (politique hôtel)</span>
                            <span className="font-medium">{Math.round(detailReserv.annulation_info.frais).toLocaleString('fr-FR')} FCFA</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Commission PHAROS sur frais</span>
                            <span className="font-medium text-blue-600">−{Math.round(detailReserv.annulation_info.commission).toLocaleString('fr-FR')} FCFA</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold border-t border-red-200 pt-2">
                            <span className="text-gray-800">Vous percevez</span>
                            <span className="text-amber-700">{Math.round(detailReserv.annulation_info.hotel_recoit).toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        </div>
                        {detailReserv.annulation_info.motif && (
                          <p className="text-xs text-gray-500 mt-1 pt-2 border-t border-red-100">
                            Motif : {detailReserv.annulation_info.motif}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Total payé par le client</span>
                          <span className="font-semibold text-gray-800">{montant.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 space-y-1.5">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Commission PHAROS ({taux}%)</span>
                            <span className="font-medium text-blue-600">{commission.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full" /> Votre Escrow</span>
                            <span className="font-medium text-amber-700">{escrow.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {detailReserv.statut === 'terminee' && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        <Banknote size={13} /> Fonds libérés — {escrow.toLocaleString('fr-FR')} FCFA transférés sur votre compte
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={() => setDetail(null)} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm">Fermer</button>
                  {peutConfirmer && (
                    <button onClick={() => confirmerSejour(detailReserv)} disabled={enConfirmation}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                      {enConfirmation ? <Loader size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                      Confirmer le séjour
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

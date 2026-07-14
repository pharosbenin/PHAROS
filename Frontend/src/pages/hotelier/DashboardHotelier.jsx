import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Users, BedDouble, Star, CheckCircle, ChevronRight, Bell, Calendar, Loader, Shield, ArrowDownToLine } from 'lucide-react'
import SidebarHotelier from '../../components/common/SidebarHotelier'
import BanniereAttente from '../../components/common/BanniereAttente'
import { useAuth } from '../../context/AuthContext'
import { useHotelActif } from '../../context/HotelActifContext'
import api from '../../services/api'
import usePolling from '../../hooks/usePolling'

const STATUT_RES = {
  confirmee:      { label: 'Confirmée',    cls: 'bg-green-100 text-green-700' },
  en_attente:     { label: 'En attente',   cls: 'bg-amber-100 text-amber-700' },
  payee:          { label: 'Payée',        cls: 'bg-blue-100 text-blue-700' },
  en_cours:       { label: 'En cours',     cls: 'bg-indigo-100 text-indigo-700' },
  confirme_client:{ label: 'Conf. client', cls: 'bg-purple-100 text-purple-700' },
  confirme_hotel: { label: 'Conf. hôtel',  cls: 'bg-purple-100 text-purple-700' },
  terminee:       { label: 'Terminée',     cls: 'bg-gray-100 text-gray-600' },
  annulee:        { label: 'Annulée',      cls: 'bg-red-100 text-red-500' },
  remboursee:     { label: 'Remboursée',   cls: 'bg-orange-100 text-orange-500' },
}

const STATUT_CHAMBRE = {
  occupee:      { label: 'Occupée',      cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  libre:        { label: 'Libre',        cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  indisponible: { label: 'Indisponible', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
}

const STATUTS_ACTIFS = ['payee', 'confirmee', 'en_cours', 'confirme_client', 'confirme_hotel']

export default function DashboardHotelier() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { hotelActif } = useHotelActif()
  const [periode, setPeriode] = useState('mois')
  const [chargement, setChargement] = useState(true)
  const [hotel, setHotel] = useState(null)
  const [reservations, setReservations] = useState([])
  const [avis, setAvis] = useState([])
  const [chambres, setChambres] = useState([])
  const [notifOuverte, setNotifOuverte] = useState(false)

  const chargerDonnees = async () => {
    if (!hotelActif) return
    try {
      const [resReservations, resAvis, resChambres] = await Promise.all([
        api.get(`/gestionnaire/reservations/?hotel_id=${hotelActif.id}`),
        api.get(`/gestionnaire/avis/?hotel_id=${hotelActif.id}`),
        api.get(`/gestionnaire/hotels/${hotelActif.id}/chambres/`),
      ])
      setHotel(hotelActif)
      setReservations(resReservations.data)
      setAvis(resAvis.data)
      setChambres(resChambres.data)
    } catch (err) {
      console.error('Erreur chargement dashboard', err)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    if (hotelActif) {
      setChargement(true)
      chargerDonnees()
    }
  }, [hotelActif?.id])

  usePolling(chargerDonnees, 30000)

  // --- Calculs ---
  const maintenant = new Date()
  const todayStr = maintenant.toISOString().slice(0, 10)

  const debutPeriode = periode === 'semaine'
    ? new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - 6)
    : periode === 'mois'
    ? new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
    : new Date(maintenant.getFullYear(), 0, 1)

  const labelPeriode = periode === 'semaine' ? '7 derniers jours' : periode === 'mois' ? 'ce mois' : 'cette année'

  // Revenus = séjours terminés dans la période (fonds libérés, reçus par l'hôtel)
  const revenus = reservations
    .filter(r => r.statut === 'terminee' && new Date(r.date_depart) >= debutPeriode)
    .reduce((sum, r) => {
      if (r.montant_hotel != null) return sum + r.montant_hotel
      const brut = parseFloat(r.prix_total || 0)
      const taux = r.commission_taux ?? 3
      return sum + Math.round(brut * (1 - taux / 100))
    }, 0)

  const reservationsActives = reservations.filter(r => STATUTS_ACTIFS.includes(r.statut)).length

  // Fonds libérés = séjours terminés (confirmation des deux parties)
  const escrowLibere = reservations
    .filter(r => r.statut === 'terminee')
    .reduce((sum, r) => {
      if (r.montant_hotel != null) return sum + r.montant_hotel
      const brut = parseFloat(r.prix_total || 0)
      const commission = r.commission_taux ?? 3
      return sum + Math.round(brut * (1 - commission / 100))
    }, 0)
  // Fonds en attente = séjours payés non encore terminés
  const escrowEnAttente = reservations
    .filter(r => STATUTS_ACTIFS.includes(r.statut))
    .reduce((sum, r) => {
      if (r.montant_hotel != null) return sum + r.montant_hotel
      const brut = parseFloat(r.prix_total || 0)
      const commission = r.commission_taux ?? 3
      return sum + Math.round(brut * (1 - commission / 100))
    }, 0)

  // Note moyenne calculée depuis les avis chargés (uniquement cet hôtel)
  const noteMoyenne = avis.length > 0
    ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1)
    : null
  const noteStr = noteMoyenne ? `${noteMoyenne} / 5` : '– / 5'
  const nbAvis = avis.length

  // Taux d'occupation sur la période : nuits occupées / (chambres × jours de la période)
  const totalChambres = chambres.reduce((sum, c) => sum + c.nombre_chambres, 0)
  const nbJoursPeriode = Math.max(1, Math.round((maintenant - debutPeriode) / 86400000) + 1)
  const nuitsOccupees = reservations
    .filter(r => [...STATUTS_ACTIFS, 'terminee'].includes(r.statut))
    .reduce((sum, r) => {
      const arrivee = new Date(r.date_arrivee)
      const depart = new Date(r.date_depart)
      const debut = new Date(Math.max(arrivee, debutPeriode))
      const fin = new Date(Math.min(depart, maintenant))
      const nuits = Math.max(0, Math.round((fin - debut) / 86400000))
      return sum + nuits
    }, 0)
  const tauxOccupation = totalChambres > 0 ? Math.min(100, Math.round((nuitsOccupees / (totalChambres * nbJoursPeriode)) * 100)) : 0

  const stats = [
    { label: `Revenus · ${labelPeriode}`, valeur: revenus.toLocaleString('fr-FR') + ' FCFA', icon: TrendingUp, couleur: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Réservations actives', valeur: String(reservationsActives), icon: BedDouble, couleur: 'text-blue-600', bg: 'bg-blue-50' },
    { label: `Taux d'occupation · ${labelPeriode}`, valeur: tauxOccupation + '%', icon: Users, couleur: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: `Note moyenne · ${nbAvis} avis`, valeur: noteStr, icon: Star, couleur: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const reservationsRecentes = [...reservations]
    .filter(r => r.statut !== 'en_attente')
    .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
    .slice(0, 5)

  const chambresStatut = chambres.map(c => {
    if (!c.est_disponible) return { nom: c.nom, statut: 'indisponible' }
    const estOccupee = reservations.some(r =>
      r.type_chambre_nom === c.nom &&
      STATUTS_ACTIFS.includes(r.statut) &&
      r.date_arrivee <= todayStr && r.date_depart > todayStr
    )
    return { nom: c.nom, statut: estOccupee ? 'occupee' : 'libre' }
  })

  const avisRecents = [...avis]
    .sort((a, b) => new Date(b.date_avis) - new Date(a.date_avis))
    .slice(0, 3)

  const arriveesAujourdhui = reservations.filter(r =>
    r.date_arrivee === todayStr && ['payee', 'confirmee'].includes(r.statut)
  )

  if (chargement) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarHotelier />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={32} className="animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />

      <div className="flex-1 min-w-0 p-6 lg:p-8">
        <div className="-mx-6 lg:-mx-8 -mt-6 lg:-mt-8 mb-6">
          <BanniereAttente hotel={hotel} />
        </div>

        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Tableau de bord</h1>
            <div className="flex items-center gap-2 mt-1">
              {hotel?.type_abonnement === 'pro' ? (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                  PRO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">
                  FREEMIUM
                </span>
              )}
              {hotel?.type_abonnement !== 'pro' && (
                <span className="text-blue-600 cursor-pointer hover:underline text-xs font-medium">Passer en PRO</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setNotifOuverte(o => !o)}
                className="relative p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                <Bell size={18} className="text-gray-500" />
                {arriveesAujourdhui.length > 0 && (
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
                    {arriveesAujourdhui.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <CheckCircle size={22} className="mx-auto mb-2 text-green-400" />
                        Aucune arrivée prévue aujourd'hui
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                        {arriveesAujourdhui.slice(0, 5).map(r => (
                          <button key={r.id} onClick={() => { setNotifOuverte(false); navigate('/hotelier/reservations') }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Calendar size={14} className="text-blue-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                Arrivée aujourd'hui : {r.nom_client ? `${r.prenom_client ?? ''} ${r.nom_client}`.trim() : 'Client'}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{r.type_chambre_nom} · {r.nb_nuits} nuit{r.nb_nuits > 1 ? 's' : ''}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { setNotifOuverte(false); navigate('/hotelier/reservations') }}
                      className="w-full text-center py-2.5 text-xs font-semibold text-blue-600 hover:bg-gray-50 border-t border-gray-50 rounded-b-2xl">
                      Voir les réservations
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
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className={`h-1 w-full ${['bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-amber-400'][i]}`} />
              <div className="p-5">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon size={20} className={s.couleur} />
                </div>
                <p className="text-xl font-black text-gray-900">{s.valeur}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bandeau Escrow */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-8 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Solde Escrow</p>
              <p className="text-xs text-gray-400 mt-0.5">Fonds libérés après confirmation des deux parties</p>
            </div>
          </div>
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="text-right">
              <p className="text-xl font-black text-purple-700">{escrowLibere.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
              <p className="text-xs text-purple-500 font-medium">Reçus (libérés)</p>
            </div>
            {escrowEnAttente > 0 && (
              <div className="text-right">
                <p className="text-xl font-black text-amber-600">{escrowEnAttente.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                <p className="text-xs text-amber-500 font-medium">En attente</p>
              </div>
            )}
            {escrowLibere > 0 && (
              <a href="/hotelier/retraits"
                className="shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                <ArrowDownToLine size={14} /> Retirer
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Réservations récentes */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900">Réservations récentes</h2>
              <a href="/hotelier/reservations" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Voir tout <ChevronRight size={13} />
              </a>
            </div>
            {reservationsRecentes.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Aucune réservation pour le moment</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {reservationsRecentes.map(r => {
                  const statutInfo = STATUT_RES[r.statut] ?? { label: r.statut, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {r.nom_client ? `${r.prenom_client ?? ''} ${r.nom_client}`.trim() : 'Client'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {r.type_chambre_nom} · {new Date(r.date_arrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(r.date_depart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <p className="text-sm font-bold text-gray-800">
                          {parseFloat(r.prix_total).toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span>
                        </p>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutInfo.cls}`}>
                          {statutInfo.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">

            {/* Statut des chambres */}
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Chambres</h2>
                <a href="/hotelier/chambres" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Gérer <ChevronRight size={13} />
                </a>
              </div>
              {chambresStatut.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Aucune chambre configurée</p>
              ) : (
                <>
                  <div className="p-4 space-y-2">
                    {chambresStatut.map((c, i) => {
                      const s = STATUT_CHAMBRE[c.statut]
                      return (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                            <p className="text-sm text-gray-700 truncate">{c.nom}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls} shrink-0 ml-2`}>
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-blue-50 rounded-lg py-2">
                      <p className="font-bold text-blue-600">{chambresStatut.filter(c => c.statut === 'occupee').length}</p>
                      <p className="text-gray-400">Occupées</p>
                    </div>
                    <div className="bg-green-50 rounded-lg py-2">
                      <p className="font-bold text-green-600">{chambresStatut.filter(c => c.statut === 'libre').length}</p>
                      <p className="text-gray-400">Libres</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg py-2">
                      <p className="font-bold text-amber-600">{chambresStatut.filter(c => c.statut === 'indisponible').length}</p>
                      <p className="text-gray-400">Indisp.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Derniers avis */}
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Derniers avis</h2>
                <a href="/hotelier/avis" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Voir tout <ChevronRight size={13} />
                </a>
              </div>
              {avisRecents.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Aucun avis pour le moment</p>
              ) : (
                <div className="p-4 space-y-3">
                  {avisRecents.map((a, i) => (
                    <div key={i} className="border border-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-800">{a.client_nom}</p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={10} className={j < a.note ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{a.commentaire}</p>
                      {!a.reponse_gestionnaire ? (
                        <a href="/hotelier/avis" className="mt-1.5 text-xs text-blue-600 hover:underline block">Répondre</a>
                      ) : (
                        <span className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle size={10} /> Répondu
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Arrivées aujourd'hui */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
            <Calendar size={16} className="text-blue-500" />
            <h2 className="font-bold text-gray-900">Arrivées aujourd'hui</h2>
          </div>
          <div className="p-5">
            {arriveesAujourdhui.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Aucune arrivée prévue aujourd'hui</p>
            ) : (
              <div className="space-y-3">
                {arriveesAujourdhui.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {r.nom_client ? `${r.prenom_client ?? ''} ${r.nom_client}`.trim() : 'Client'}
                      </p>
                      <p className="text-xs text-gray-500">{r.type_chambre_nom} · {r.nb_nuits} nuit{r.nb_nuits > 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2.5 py-1 rounded-full">
                      Check-in aujourd'hui
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

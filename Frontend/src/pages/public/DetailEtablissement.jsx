import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  MapPin, Star, Wifi, Car, Coffee, Waves, Dumbbell, Sparkles, Wind,
  Phone, Mail, Globe, ChevronLeft, Heart, Share2, X, ChevronRight,
  ChevronLeft as ArrowLeft, Users, Clock, CheckCircle, Building2,
  Leaf, Camera, Bed, Utensils, AlertCircle, Info, Loader2
} from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const LABELS_EQ_CHAMBRE = {
  wifi: 'WiFi', clim: 'Climatisation', tv: 'Télévision', coffre: 'Coffre-fort',
  minibar: 'Minibar', frigo: 'Réfrigérateur', fer: 'Fer à repasser',
  seche_cheveux: 'Sèche-cheveux', bureau: 'Bureau de travail',
  sdb_privee: 'Salle de bain privée', jacuzzi: 'Jacuzzi / Baignoire', douche: 'Douche séparée',
  petit_dej: 'Petit-déjeuner inclus', kitchenette: 'Kitchenette',
  balcon: 'Balcon / Terrasse', parking: 'Parking privé', piscine: 'Piscine',
  sport: 'Salle de sport', telephone: 'Téléphone chambre', audio: 'Système audio', pmr: 'Accès PMR',
}

const ICONES_EQ = {
  wifi: { icon: <Wifi size={16} />, label: 'WiFi Gratuit' },
  parking: { icon: <Car size={16} />, label: 'Parking' },
  restaurant: { icon: <Coffee size={16} />, label: 'Restaurant' },
  piscine: { icon: <Waves size={16} />, label: 'Piscine' },
  climatisation: { icon: <Wind size={16} />, label: 'Climatisation' },
  salle_sport: { icon: <Dumbbell size={16} />, label: 'Salle de sport' },
  spa: { icon: <Sparkles size={16} />, label: 'Spa & Bien-être' },
  bar: { icon: <Coffee size={16} />, label: 'Bar' },
  jardin: { icon: <Leaf size={16} />, label: 'Jardin tropical' },
}

function NoteBadge({ note, nb }) {
  const couleur = note >= 4.5 ? 'bg-green-600' : note >= 4.0 ? 'bg-blue-600' : 'bg-amber-500'
  const label = note >= 4.7 ? 'Exceptionnel' : note >= 4.5 ? 'Superbe' : note >= 4.0 ? 'Très bien' : 'Bien'
  return (
    <div className="flex items-center gap-2">
      <span className={`${couleur} text-white text-base font-black px-3 py-1.5 rounded-lg`}>{note.toFixed(1)}</span>
      <div>
        <p className="font-bold text-gray-900 text-sm">{label}</p>
        {nb && <p className="text-xs text-gray-500">{nb} évaluations</p>}
      </div>
    </div>
  )
}

function GalerieModal({ photos, indexDepart, onClose }) {
  const [index, setIndex] = useState(indexDepart)
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2" onClick={onClose}>
        <X size={28} />
      </button>
      <button className="absolute left-4 text-white hover:text-gray-300 p-3 rounded-full bg-white/10 hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); setIndex(i => (i - 1 + photos.length) % photos.length) }}>
        <ArrowLeft size={24} />
      </button>
      <div onClick={e => e.stopPropagation()} className="max-w-5xl max-h-screen p-4">
        <img src={photos[index]} alt="" className="max-h-[85vh] max-w-full object-contain rounded-xl" />
        <p className="text-white text-center mt-3 text-sm">{index + 1} / {photos.length}</p>
      </div>
      <button className="absolute right-4 text-white hover:text-gray-300 p-3 rounded-full bg-white/10 hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); setIndex(i => (i + 1) % photos.length) }}>
        <ChevronRight size={24} />
      </button>

      {/* Miniatures */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-lg px-4">
        {photos.map((p, i) => (
          <img key={i} src={p} alt="" onClick={(e) => { e.stopPropagation(); setIndex(i) }}
            className={`w-12 h-10 object-cover rounded cursor-pointer shrink-0 transition-all ${i === index ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'}`} />
        ))}
      </div>
    </div>
  )
}

const BACKEND_URL = 'http://localhost:8000'
const PHOTOS_FALLBACK = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&auto=format&fit=crop',
]

function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BACKEND_URL + path
}

const MOIS = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.']

function formatOccupation(occupation) {
  if (!occupation) return null
  const d1 = new Date(occupation.date_arrivee + 'T00:00:00')
  const d2 = new Date(occupation.date_depart + 'T00:00:00')
  const j1 = d1.getDate(), m1 = MOIS[d1.getMonth()]
  const j2 = d2.getDate(), m2 = MOIS[d2.getMonth()]
  if (m1 === m2) return `du ${j1} au ${j2} ${m2}`
  return `du ${j1} ${m1} au ${j2} ${m2}`
}

function genererUrlGoogleMaps(h) {
  if (h.latitude && h.longitude) {
    return `https://maps.google.com/?q=${h.latitude},${h.longitude}`
  }
  const q = encodeURIComponent(`${h.adresse || ''} ${h.ville || ''} Bénin`.trim())
  return `https://maps.google.com/?q=${q}`
}

function normaliserHotel(h) {
  const chambres = (h.types_chambres || []).map(c => ({
    ...c,
    type: c.nom,
    prix: c.promotion_active ? c.promotion_active.prix_promo : parseFloat(c.prix_nuit),
    prix_original: c.promotion_active ? parseFloat(c.prix_nuit) : null,
    promotion: c.promotion_active || null,
    dispo: c.est_disponible,
    occupation: c.occupation_actuelle || null,
    photo: mediaUrl(c.photos?.[0]?.image),
  }))
  const equipements = [...new Set([...(h.equipements || []), ...chambres.flatMap(c => c.equipements || [])])]
  const photosSet = new Set()
  if (h.photos && h.photos.length > 0) {
    h.photos.forEach(p => { if (p.image) photosSet.add(mediaUrl(p.image)) })
  } else if (h.photo_principale) {
    photosSet.add(mediaUrl(h.photo_principale))
  }
  const _photos = [...photosSet].filter(Boolean)
  return {
    ...h,
    abonnement: h.type_abonnement,
    note_moyenne: parseFloat(h.note_moyenne) || 0,
    nb_avis: h.nombre_avis || 0,
    localisation: h.quartier || h.adresse || '',
    departement: h.ville,
    latitude: h.latitude ? parseFloat(h.latitude) : null,
    longitude: h.longitude ? parseFloat(h.longitude) : null,
    google_maps: genererUrlGoogleMaps(h),
    etoiles: 0,
    type: 'hôtel',
    equipements,
    prix_min: chambres.filter(c => c.dispo).reduce((min, c) => Math.min(min, c.prix), Infinity) || chambres[0]?.prix || 0,
    chambres,
    avis: [],
    restaurant: null,
    _photos,
  }
}

export default function DetailEtablissement() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const peutReserver = !user || user.role === 'client'
  const estBloqueParRole = user && user.role !== 'client'
  const [hotel, setHotel] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState(false)

  const [menuHotel, setMenuHotel] = useState(null)
  const [galerieOuverte, setGalerieOuverte] = useState(false)
  const [galerieIndex, setGalerieIndex] = useState(0)
  const [onglet, setOnglet] = useState('chambres')
  const [dateArrivee, setDateArrivee] = useState(searchParams.get('arrivee') || '')
  const [dateDepart, setDateDepart] = useState(searchParams.get('depart') || '')
  const voyageursDemandes = parseInt(searchParams.get('voyageurs')) || 0
  const [enFavori, setEnFavori] = useState(false)
  const [erreurDates, setErreurDates] = useState(false)
  const [signalModalOuvert, setSignalModalOuvert] = useState(false)
  const [signalMotif, setSignalMotif] = useState('')
  const [signalDescription, setSignalDescription] = useState('')
  const [signalEnvoi, setSignalEnvoi] = useState(false)
  const [signalOk, setSignalOk] = useState(false)
  const [signalErreur, setSignalErreur] = useState('')
  // IDs des chambres disponibles pour les dates sélectionnées (null = pas encore filtré)
  const [chambresDispoIds, setChambresDispoIds] = useState(null)
  const [chambreDetail, setChambreDetail] = useState(null)
  // Le client a-t-il une réservation active (payée, ni terminée ni annulée) sur CET hôtel ?
  const [reservationActiveIci, setReservationActiveIci] = useState(false)

  // Le bouton "Signaler" n'a de sens que pendant la fenêtre d'une réservation en cours sur cet
  // hôtel précis : pas avant paiement, plus après séjour terminé/annulé (→ l'avis prend le relais).
  const STATUTS_NON_SIGNALABLES = ['en_attente', 'terminee', 'annulee', 'remboursee']
  useEffect(() => {
    if (!user || user.role !== 'client' || !id) { setReservationActiveIci(false); return }
    let annule = false
    api.get('/client/reservations/')
      .then(res => {
        if (annule) return
        const active = (res.data || []).some(r =>
          String(r.hotel_id) === String(id) && !STATUTS_NON_SIGNALABLES.includes(r.statut)
        )
        setReservationActiveIci(active)
      })
      .catch(() => setReservationActiveIci(false))
    return () => { annule = true }
  }, [user, id])

  useEffect(() => {
    async function charger() {
      try {
        const [resHotel, resMenu, resAvis] = await Promise.all([
          api.get(`/hotels/${id}/`),
          api.get(`/hotels/${id}/menu/`).catch(() => null),
          api.get(`/hotels/${id}/avis/`).catch(() => ({ data: [] })),
        ])
        const h = normaliserHotel(resHotel.data)
        h.avis = resAvis.data
        setHotel(h)
        if (resMenu) setMenuHotel(resMenu.data)
      } catch {
        setErreurChargement(true)
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [id])

  // Re-vérifie la disponibilité par chevauchement de dates dès que les deux dates sont saisies
  useEffect(() => {
    if (!dateArrivee || !dateDepart || !id) {
      setChambresDispoIds(null)
      return
    }
    api.get(`/hotels/${id}/chambres/?date_arrivee=${dateArrivee}&date_depart=${dateDepart}`)
      .then(res => setChambresDispoIds(new Set(res.data.map(c => c.id))))
      .catch(() => setChambresDispoIds(null))
  }, [dateArrivee, dateDepart, id])

  if (chargement) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      </Layout>
    )
  }

  if (erreurChargement || !hotel) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hôtel introuvable</h2>
          <button onClick={() => navigate('/recherche')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold mt-4">
            Retour à la recherche
          </button>
        </div>
      </Layout>
    )
  }

  const toutesPhotos = hotel._photos.length > 0 ? hotel._photos : PHOTOS_FALLBACK
  const photosGalerie = toutesPhotos

  const nuits = dateArrivee && dateDepart
    ? Math.max(0, Math.round((new Date(dateDepart) - new Date(dateArrivee)) / 86400000))
    : 0

  const handleReserver = (chambre) => {
    if (!dateArrivee || !dateDepart) {
      setErreurDates(true)
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      return
    }
    setErreurDates(false)
    navigate(`/reservation/${id}?chambreId=${chambre.id}&hotelId=${id}&arrivee=${dateArrivee}&depart=${dateDepart}&nuits=${nuits}`)
  }

  // Disponibilité effective : filtrée par dates si l'utilisateur a sélectionné des dates, sinon état général (aujourd'hui)
  const isDispo = (chambre) => chambresDispoIds !== null ? chambresDispoIds.has(chambre.id) : true

  // Si un nombre de voyageurs a été précisé (venant de l'accueil/recherche), les chambres
  // qui peuvent l'accueillir sont affichées en premier (tri stable, aucune chambre masquée).
  const chambresTriees = voyageursDemandes > 0
    ? [...hotel.chambres].sort((a, b) => {
        const aOk = a.capacite >= voyageursDemandes
        const bOk = b.capacite >= voyageursDemandes
        if (aOk === bOk) return 0
        return aOk ? -1 : 1
      })
    : hotel.chambres

  const ouvrirGalerie = (index) => { setGalerieIndex(index); setGalerieOuverte(true) }

  const soumettrSignalement = async () => {
    if (!signalMotif || !signalDescription.trim()) return
    setSignalEnvoi(true)
    setSignalErreur('')
    try {
      await api.post('/signalements/hotel/', { hotel: hotel.id, motif: signalMotif, description: signalDescription })
      setSignalOk(true); setSignalModalOuvert(false)
    } catch (err) {
      const data = err.response?.data
      const msg = data?.hotel?.[0] || data?.detail || Object.values(data || {})[0] || "Impossible d'envoyer ce signalement."
      setSignalErreur(typeof msg === 'string' ? msg : "Impossible d'envoyer ce signalement.")
    } finally { setSignalEnvoi(false) }
  }

  return (
    <Layout>
      {galerieOuverte && (
        <GalerieModal photos={toutesPhotos} indexDepart={galerieIndex} onClose={() => setGalerieOuverte(false)} />
      )}

      {/* Modale signalement hôtel */}
      {signalModalOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Signaler cet établissement</h3>
              <button onClick={() => setSignalModalOuvert(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Votre signalement sera transmis à notre équipe de modération. Il ne sera pas visible publiquement.</p>
            {signalErreur && <p className="text-xs text-red-500 mb-3 bg-red-50 rounded-lg px-3 py-2">{signalErreur}</p>}
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Motif</label>
              <select value={signalMotif} onChange={e => setSignalMotif(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400">
                <option value="">Sélectionner un motif...</option>
                <option value="tromperie">Informations trompeuses</option>
                <option value="hygiene">Problème d'hygiène</option>
                <option value="securite">Problème de sécurité</option>
                <option value="escroquerie">Escroquerie</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
              <textarea value={signalDescription} onChange={e => setSignalDescription(e.target.value)}
                rows={4} placeholder="Décrivez le problème en détail..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSignalModalOuvert(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={soumettrSignalement} disabled={!signalMotif || !signalDescription.trim() || signalEnvoi}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                {signalEnvoi ? 'Envoi...' : 'Envoyer le signalement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Retour */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-4 transition-colors">
          <ChevronLeft size={18} /> Retour aux résultats
        </button>

        {/* Titre */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {hotel.abonnement === 'pro' && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">Partenaire certifié</span>
              )}
              {hotel.etoiles > 0 && (
                <div className="flex items-center gap-0.5">
                  {[...Array(hotel.etoiles)].map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                </div>
              )}
              <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">{hotel.type}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{hotel.nom}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin size={14} className="text-blue-500" />{hotel.localisation}, {hotel.ville}</span>
              {hotel.note_moyenne > 0 && <NoteBadge note={hotel.note_moyenne} nb={hotel.nb_avis} />}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setEnFavori(!enFavori)}
              className={`p-2.5 rounded-xl border transition-all ${enFavori ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
              <Heart size={20} className={enFavori ? 'text-red-500 fill-red-500' : 'text-gray-500'} />
            </button>
            <button className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white transition-all">
              <Share2 size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* ===== GALERIE style Booking.com ===== */}
        <div className="relative rounded-2xl overflow-hidden mb-6 cursor-pointer" onClick={() => ouvrirGalerie(0)}>
          <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-72 sm:h-96">
            {/* Grande photo principale */}
            <div className="col-span-2 row-span-2 overflow-hidden">
              <img src={photosGalerie[0]} alt={hotel.nom}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            {/* 4 petites photos */}
            {photosGalerie.slice(1, 5).map((photo, i) => (
              <div key={i} className="overflow-hidden relative">
                <img src={photo} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                {i === 3 && toutesPhotos.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">+{toutesPhotos.length - 5} photos</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            className="absolute bottom-4 right-4 bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 flex items-center gap-2"
            onClick={(e) => { e.stopPropagation(); ouvrirGalerie(0) }}>
            <Camera size={15} /> Voir toutes les photos ({toutesPhotos.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
              <h2 className="font-black text-gray-900 text-xl mb-3">À propos de l'établissement</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{hotel.description}</p>

              {/* Équipements */}
              <h3 className="font-bold text-gray-800 mb-3">Équipements & Services</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hotel.equipements.map(eq => ICONES_EQ[eq] && (
                  <div key={eq} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <span className="text-blue-600">{ICONES_EQ[eq].icon}</span>
                    {ICONES_EQ[eq].label}
                  </div>
                ))}
              </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl overflow-x-auto">
              {[['chambres', 'Chambres'], ['restauration', 'Restaurant'], ['avis', `Avis (${hotel.avis?.length || 0})`], ['localisation', 'Localisation']].map(([key, label]) => (
                <button key={key} onClick={() => setOnglet(key)}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap px-2 sm:px-4 ${onglet === key ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* === CHAMBRES === */}
            {onglet === 'chambres' && (
              <div className="space-y-4">
                {!dateArrivee && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex items-center gap-2">
                    <Info size={15} className="shrink-0" /> Sélectionnez vos dates (à droite) pour voir les prix exacts et réserver.
                  </div>
                )}
                {chambresTriees.map(chambre => {
                  const dispo = isDispo(chambre)
                  return (
                  <div key={chambre.id} className={`bg-white rounded-2xl border overflow-hidden ${!dispo ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:border-blue-200 hover:shadow-md transition-all'}`}>
                    <div className="flex flex-col sm:flex-row">
                      {chambre.photo && (
                        <div className="sm:w-48 h-40 sm:h-auto shrink-0 overflow-hidden">
                          <img src={chambre.photo} alt={chambre.type}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="flex flex-1 p-5 justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-base">{chambre.type}</h3>
                            {!dispo && dateArrivee && dateDepart && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                Indisponible pour ces dates
                              </span>
                            )}
                            {chambre.promotion && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">Promo {chambre.promotion.titre ? `· ${chambre.promotion.titre}` : ''}</span>}
                            {voyageursDemandes > 0 && chambre.capacite >= voyageursDemandes && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                Convient pour {voyageursDemandes} voyageur{voyageursDemandes > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                            <Users size={13} /> Jusqu'à {chambre.capacite} personnes
                          </p>
                          {chambre.description && (
                            <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{chambre.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {chambre.equipements?.slice(0, 4).map(eq => (
                              <span key={eq} className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">
                                <CheckCircle size={10} /> {LABELS_EQ_CHAMBRE[eq] || eq}
                              </span>
                            ))}
                            {chambre.equipements?.length > 4 && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                +{chambre.equipements.length - 4} autres
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col justify-between items-end">
                          <div>
                            {chambre.promotion && chambre.prix_original && (
                              <p className="text-sm text-gray-400 line-through text-right">{Math.round(chambre.prix_original).toLocaleString()} FCFA</p>
                            )}
                            <p className={`text-2xl font-black ${chambre.promotion ? 'text-red-600' : 'text-blue-700'}`}>{Math.round(chambre.prix).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">FCFA / nuit</p>
                            {chambre.promotion && (
                              <p className="text-xs text-red-500 font-medium mt-0.5">
                                Jusqu'au {new Date(chambre.promotion.date_fin).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                            {nuits > 0 && (
                              <p className="text-sm font-bold text-gray-700 mt-1">
                                {Math.round(chambre.prix * nuits).toLocaleString()} FCFA
                                <span className="text-xs font-normal text-gray-400"> · {nuits} nuit{nuits > 1 ? 's' : ''}</span>
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setChambreDetail(chambre)}
                            className="mt-2 text-xs text-blue-600 hover:text-orange-500 font-medium transition-colors">
                            Voir les détails
                          </button>
                          {estBloqueParRole ? (
                            <p className="mt-2 text-xs text-gray-400 italic text-center">
                              Réservation non disponible pour votre compte
                            </p>
                          ) : (
                            <button onClick={() => dispo && handleReserver(chambre)}
                              disabled={!dispo}
                              className={`mt-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${dispo
                                ? 'bg-orange-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}>
                              {dispo ? 'Je réserve' : 'Indisponible pour ces dates'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}

            {/* === RESTAURANT === */}
            {onglet === 'restauration' && (
              <div className="space-y-4">
                {!menuHotel || !menuHotel.a_restauration ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                    <Utensils size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold mb-1">Pas de restauration disponible</p>
                    <p className="text-sm text-gray-400">Cet établissement ne propose pas encore de menu en ligne.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-orange-700">
                      <Info size={15} className="shrink-0 mt-0.5" />
                      La commande se fait depuis votre espace client lors de votre séjour. Le paiement est réglé directement à l'hôtel.
                    </div>
                    {(() => {
                      const CATS = {
                        entrees: 'Entrées', plats: 'Plats principaux', grillades: 'Grillades',
                        poissons: 'Poissons & Fruits de mer', vegetarien: 'Végétarien',
                        desserts: 'Desserts', boissons: 'Boissons', petit_dejeuner: 'Petit-déjeuner',
                      }
                      const parCat = menuHotel.plats.reduce((acc, p) => {
                        if (!acc[p.categorie]) acc[p.categorie] = []
                        acc[p.categorie].push(p)
                        return acc
                      }, {})
                      return Object.entries(parCat).map(([cat, plats]) => (
                        <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60">
                            <h3 className="font-bold text-gray-700 text-sm">{CATS[cat] || cat}</h3>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {plats.map(plat => (
                              <div key={plat.id} className="flex items-center gap-3 px-5 py-4">
                                {plat.photo && (
                                  <img src={mediaUrl(plat.photo)} alt={plat.nom}
                                    className="w-32 h-32 rounded-xl object-cover shrink-0 border border-gray-100" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm">{plat.nom}</p>
                                  {plat.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{plat.description}</p>}
                                </div>
                                <p className="font-black text-orange-600 text-sm shrink-0">{parseFloat(plat.prix).toLocaleString()} FCFA</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </>
                )}
              </div>
            )}

            {/* === AVIS === */}
            {onglet === 'avis' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-5xl font-black text-gray-900">{hotel.note_moyenne}</p>
                    <div className="flex justify-center mt-1 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < Math.round(hotel.note_moyenne) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{hotel.nb_avis} avis vérifiés</p>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map(n => {
                      const count = hotel.avis?.filter(a => a.note === n).length || 0
                      const pct = hotel.avis?.length ? Math.round((count / hotel.avis.length) * 100) : 0
                      return (
                        <div key={n} className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 w-3">{n}</span>
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-6">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {hotel.avis?.map(avis => (
                  <div key={avis.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold">{(avis.client_nom || 'A').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-800">{avis.client_nom || 'Anonyme'}</p>
                          <p className="text-xs text-gray-400">{new Date(avis.date_avis).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={13} className={i < avis.note ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{avis.commentaire}</p>
                    {avis.reponse_gestionnaire && (
                      <div className="mt-3 pl-4 border-l-2 border-blue-300 bg-blue-50 p-3 rounded-r-xl">
                        <p className="text-xs font-bold text-blue-700 mb-1">Réponse de l'établissement</p>
                        <p className="text-sm text-gray-600">{avis.reponse_gestionnaire}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Bouton signaler l'hôtel : visible uniquement si le client a une réservation
                    active (payée, pas encore terminée/annulée) sur cet hôtel précis. */}
                {user?.role === 'client' && reservationActiveIci && (
                  <div className="pt-2 border-t border-gray-100">
                    {signalOk ? (
                      <p className="text-xs text-green-600 flex items-center gap-1.5">
                        <CheckCircle size={13} /> Votre signalement a été transmis à notre équipe.
                      </p>
                    ) : (
                      <button onClick={() => setSignalModalOuvert(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">
                        <AlertCircle size={13} /> Signaler cet établissement
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* === LOCALISATION === */}
            {onglet === 'localisation' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Carte OpenStreetMap si coordonnées GPS disponibles */}
                  {hotel.latitude && hotel.longitude ? (
                    <iframe
                      title="Localisation"
                      className="w-full h-64 border-0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${hotel.longitude - 0.01},${hotel.latitude - 0.01},${hotel.longitude + 0.01},${hotel.latitude + 0.01}&layer=mapnik&marker=${hotel.latitude},${hotel.longitude}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 h-52 flex items-center justify-center relative">
                      <div className="text-center z-10">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <MapPin size={24} className="text-white" />
                        </div>
                        <p className="font-bold text-gray-800">{hotel.nom}</p>
                        <p className="text-sm text-gray-500">{hotel.localisation}</p>
                        <p className="text-sm text-gray-500">{hotel.ville}, Bénin</p>
                      </div>
                      <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{hotel.nom}</p>
                        <p className="text-sm text-gray-500">{hotel.adresse}{hotel.quartier ? `, ${hotel.quartier}` : ''}</p>
                        <p className="text-sm text-gray-500">{hotel.ville}, Bénin</p>
                      </div>
                    </div>
                    <a href={hotel.google_maps} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors mb-4">
                      <MapPin size={18} />
                      Ouvrir dans Google Maps
                    </a>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bloc réservation sticky */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-5 sticky top-28">
              <p className="text-sm text-gray-400 font-medium mb-0.5">À partir de</p>
              <p className="text-3xl font-black text-blue-700 mb-1">
                {hotel.prix_min.toLocaleString()}
                <span className="text-base font-normal text-gray-400"> FCFA</span>
              </p>
              <p className="text-xs text-gray-400 mb-4">par nuit · taxes incluses</p>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="border-2 border-gray-200 focus-within:border-blue-400 rounded-xl p-3 transition-colors">
                  <label className="text-xs text-gray-400 font-semibold block mb-0.5">ARRIVÉE</label>
                  <input type="date" value={dateArrivee}
                    onChange={e => { setDateArrivee(e.target.value); if (dateDepart && e.target.value >= dateDepart) setDateDepart(''); setErreurDates(false) }}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-sm text-gray-800 w-full outline-none font-medium cursor-pointer" />
                </div>
                <div className="border-2 border-gray-200 focus-within:border-blue-400 rounded-xl p-3 transition-colors">
                  <label className="text-xs text-gray-400 font-semibold block mb-0.5">DÉPART</label>
                  <input type="date" value={dateDepart}
                    onChange={e => { setDateDepart(e.target.value); setErreurDates(false) }}
                    min={dateArrivee ? new Date(new Date(dateArrivee).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    className="text-sm text-gray-800 w-full outline-none font-medium cursor-pointer" />
                </div>
              </div>

              {nuits > 0 && (
                <p className="text-center text-sm font-semibold text-blue-600 mb-3 bg-blue-50 rounded-lg py-1.5">
                  {nuits} nuit{nuits > 1 ? 's' : ''} sélectionnée{nuits > 1 ? 's' : ''}
                </p>
              )}

              {erreurDates && (
                <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" /> Veuillez choisir vos dates avant de réserver.
                </div>
              )}

              <button onClick={() => { setOnglet('chambres'); document.querySelector('.onglets')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="w-full bg-orange-500 hover:bg-blue-600 active:bg-blue-700 text-white font-black py-3.5 rounded-xl transition-all text-base shadow-md hover:shadow-lg">
                Voir les chambres disponibles
              </button>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-500 shrink-0" />
                  Paiement sécurisé via Mobile Money
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-500 shrink-0" />
                  Fonds protégés par Escrow PHAROS
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-500 shrink-0" />
                  Check-in par QR Code à l'arrivée
                </div>
              </div>

              {hotel.note_moyenne > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <NoteBadge note={hotel.note_moyenne} nb={hotel.nb_avis} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal détail chambre */}
      {chambreDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setChambreDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Photo */}
            {chambreDetail.photo && (
              <div className="h-52 overflow-hidden rounded-t-2xl">
                <img src={chambreDetail.photo} alt={chambreDetail.type} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6">
              {/* Titre + fermer */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold text-gray-900">{chambreDetail.type}</h2>
                <button onClick={() => setChambreDetail(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={20} />
                </button>
              </div>

              {/* Capacité + prix */}
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users size={14} /> Jusqu'à {chambreDetail.capacite} personnes
                </span>
                <span className="text-xl font-black text-blue-700">
                  {Math.round(chambreDetail.prix).toLocaleString()} <span className="text-sm font-normal text-gray-400">FCFA/nuit</span>
                </span>
              </div>

              {/* Description complète */}
              {chambreDetail.description && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{chambreDetail.description}</p>
                </div>
              )}

              {/* Équipements */}
              {chambreDetail.equipements?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Équipements inclus</p>
                  <div className="flex flex-wrap gap-2">
                    {chambreDetail.equipements.map(eq => (
                      <span key={eq} className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-full font-medium">
                        <CheckCircle size={11} /> {LABELS_EQ_CHAMBRE[eq] || eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton réserver */}
              {!estBloqueParRole && (
                <button
                  onClick={() => { setChambreDetail(null); handleReserver(chambreDetail) }}
                  disabled={!isDispo(chambreDetail)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${isDispo(chambreDetail)
                    ? 'bg-orange-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {isDispo(chambreDetail) ? 'Je réserve cette chambre' : 'Indisponible pour ces dates'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

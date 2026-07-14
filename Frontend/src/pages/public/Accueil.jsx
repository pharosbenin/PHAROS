import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Calendar, Users, Star, ChevronRight, ChevronLeft, Shield, Smartphone, QrCode, Building2, Globe, TrendingUp, Award } from 'lucide-react'
import Layout from '../../components/common/Layout'
import CarteHotel from '../../components/common/CarteHotel'
import api from '../../services/api'
import img1 from '../../../../image/pharos-img/1.jpeg'
import img2 from '../../../../image/pharos-img/2.jpeg'
import img3 from '../../../../image/pharos-img/3.jpeg'
import img4 from '../../../../image/pharos-img/4.jpeg'
import img5 from '../../../../image/pharos-img/5.jpeg'
import img6 from '../../../../image/pharos-img/6.jpeg'
import img7 from '../../../../image/pharos-img/7.jpeg'
import img8 from '../../../../image/pharos-img/8.jpeg'
import img9 from '../../../../image/pharos-img/9.jpeg'
import img10 from '../../../../image/pharos-img/10.jpeg'
import img11 from '../../../../image/pharos-img/11.jpeg'
import img12 from '../../../../image/pharos-img/12.jpeg'
import img13 from '../../../../image/pharos-img/13.jpeg'
import img14 from '../../../../image/pharos-img/14.jpeg'
import img15 from '../../../../image/pharos-img/15.jpeg'


const BACKEND_URL = 'http://localhost:8000'
function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BACKEND_URL + path
}

const TOUTES_VILLES_BENIN = [
  'Cotonou',
  'Porto-Novo', 'Adjohoun', 'Akpro-Missérété', 'Avrankou', 'Bonou', 'Dangbo', 'Missérété', 'Sèmè-Kpodji',
  'Abomey-Calavi', 'Allada', 'Ouidah', 'Kpomassè', 'Sô-Ava', 'Toffo', 'Tori-Bossito', 'Zè',
  'Parakou', 'Bembèrèkè', 'Kalalé', "N'Dali", 'Nikki', 'Pèrèrè', 'Sinendé', 'Tchaourou',
  'Abomey', 'Bohicon', 'Agbangnizoun', 'Covè', 'Djidja', 'Ouinhi', 'Zagnanado', 'Za-Kpota', 'Zogbodomè',
  'Dassa-Zoumè', 'Glazoué', 'Bantè', 'Ouèssè', 'Savalou', 'Savè',
  'Natitingou', 'Boukoumbé', 'Cobly', 'Copargo', 'Kérou', 'Kouandé', 'Matéri', 'Péhunco', 'Tanguiéta', 'Toukountouna',
  'Malanville', 'Banikoara', 'Gogounou', 'Kandi', 'Karimama', 'Ségbana',
  'Djougou', 'Bassila', 'Ouaké',
  'Lokossa', 'Athiémé', 'Bopa', 'Comè', 'Grand-Popo', 'Houéyogbé',
  'Aplahoué', 'Djakotomey', 'Dogbo', 'Klouékanmè', 'Lalo', 'Toviklin',
  'Kétou', 'Pobè', 'Sakété', 'Adja-Ouèrè', 'Ifangni',
]

const EVENEMENTS_FALLBACK = [
  { nom: 'Fête du Vodun', date: '10 Jan', lieu: 'Ouidah', couleur: 'bg-purple-50 text-purple-700 border-purple-200' },
  { nom: 'Pèlerinage de Dassa', date: '15 Août', lieu: 'Dassa-Zoumè', couleur: 'bg-blue-50 text-blue-700 border-blue-200' },
  { nom: 'Festival Weloveya', date: 'Décembre', lieu: 'Cotonou', couleur: 'bg-green-50 text-green-700 border-green-200' },
  { nom: 'Fête Nationale', date: '1er Août', lieu: 'Porto-Novo', couleur: 'bg-amber-50 text-amber-700 border-amber-200' },
]

const COULEURS_EVT = [
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-green-50 text-green-700 border-green-200',
  'bg-amber-50 text-amber-700 border-amber-200',
]

const MOIS_COURTS = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const STATS = [
  { valeur: '200+', label: 'Établissements' },
  { valeur: '15 000+', label: 'Réservations' },
  { valeur: '60 villes+', label: 'Au Bénin' },
  { valeur: '4.7 / 5', label: 'Note moyenne' },
]

const STATS_ICONS = [
  <Building2 size={20} className="text-[#F57C2B]" />,
  <TrendingUp size={20} className="text-[#F57C2B]" />,
  <Globe size={20} className="text-[#F57C2B]" />,
  <Star size={20} className="text-[#F57C2B]" />,
]

const PHOTOS_HOTELS = [
  img1,
  img2,
  img3,
  img4,
  img5,
  img6,
  img7,
  img8,
  img9,
  img10,
  img11,
  img12,
  img13,
  img14,
  img15
];

const GALERIE_FALLBACK = PHOTOS_HOTELS

const AVIS_STATIQUES = [
  { auteur: 'Adjoua K.', ville: 'Cotonou', note: 5, hotel: 'Hôtel de luxe', texte: 'Séjour exceptionnel ! Le check-in par QR Code est vraiment pratique. Je n\'ai pas eu à attendre du tout à la réception.' },
  { auteur: 'Kofi M.', ville: 'Parakou', note: 5, hotel: 'Résidence Palm Beach', texte: 'Le paiement Mobile Money est très pratique. La plateforme PHAROS rend tout simple pour nous les béninois.' },
  { auteur: 'Jean-Paul A.', ville: 'Porto-Novo', note: 5, hotel: 'Grand Hôtel de Dassa', texte: 'Très pratique pour trouver un hébergement à Dassa lors du pèlerinage. Je recommande PHAROS à tous les voyageurs béninois.' },
]

function normaliserHotel(h) {
  return {
    ...h,
    prix_min: h.prix_min || (h.types_chambres?.[0]?.prix_nuit ? parseFloat(h.types_chambres[0].prix_nuit) : null),
    note_moyenne: parseFloat(h.note_moyenne) || 0,
    nb_avis: h.nombre_avis || 0,
    abonnement: h.type_abonnement,
    localisation: h.quartier ? `${h.quartier}, ${h.ville}` : (h.ville || h.adresse || ''),
    equipements: h.equipements || [],
  }
}

export default function Accueil() {
  const navigate = useNavigate()
  const [localite, setLocalite] = useState('')
  const [dateArrivee, setDateArrivee] = useState('')
  const [dateDepart, setDateDepart] = useState('')
  const [voyageurs, setVoyageurs] = useState(1)
  const [hotels, setHotels] = useState([])
  const [villesAvecHotels, setVillesAvecHotels] = useState([])
  const [evenements, setEvenements] = useState(EVENEMENTS_FALLBACK)

  useEffect(() => {
    api.get('/hotels/')
      .then(res => setHotels(res.data.map(normaliserHotel)))
      .catch(() => setHotels([]))
    api.get('/hotels/villes/')
      .then(res => setVillesAvecHotels(res.data || []))
      .catch(() => setVillesAvecHotels([]))
    api.get('/evenements/')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setEvenements(res.data.map((e, i) => ({
            id: e.id,
            nom: e.nom,
            date: e.date_debut
              ? `${new Date(e.date_debut).getDate()} ${MOIS_COURTS[new Date(e.date_debut).getMonth()]}`
              : '',
            lieu: e.villes_concernees?.[0] || e.region || '',
            couleur: COULEURS_EVT[i % COULEURS_EVT.length],
            latitude: e.latitude,
            longitude: e.longitude,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const handleRecherche = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (localite) params.set('ville', localite)
    if (dateArrivee) params.set('arrivee', dateArrivee)
    if (dateDepart) params.set('depart', dateDepart)
    params.set('voyageurs', voyageurs || 1)
    navigate(`/recherche?${params.toString()}`)
  }

  const hotelsPro = hotels.filter(h => h.abonnement === 'pro')
  const hotelsRecommandes = hotels.slice(0, 4)

  const paramsEtablissement = new URLSearchParams()
  if (dateArrivee) paramsEtablissement.set('arrivee', dateArrivee)
  if (dateDepart) paramsEtablissement.set('depart', dateDepart)
  if (voyageurs) paramsEtablissement.set('voyageurs', voyageurs)
  const queryStringEtablissement = paramsEtablissement.toString()

  const scrollRefPro = useRef(null)
  const scrollRefRec = useRef(null)
  const scrollRefGal = useRef(null)

  const [proIdx, setProIdx] = useState(0)
  const [recIdx, setRecIdx] = useState(0)
  const [galIdx, setGalIdx] = useState(0)

  const scrollTo = (ref, idx, cardW) => {
    ref.current?.scrollTo({ left: idx * cardW, behavior: 'smooth' })
  }

  const go = (ref, setIdx, total, dir, cardW) => {
    setIdx(prev => {
      const next = (prev + dir + total) % total
      scrollTo(ref, next, cardW)
      return next
    })
  }

  useEffect(() => {
    if (!hotelsPro.length) return
    const t = setInterval(() => go(scrollRefPro, setProIdx, Math.min(hotelsPro.length, 5), 1, 296), 3000)
    return () => clearInterval(t)
  }, [hotelsPro.length])

  useEffect(() => {
    if (!hotelsRecommandes.length) return
    const t = setInterval(() => go(scrollRefRec, setRecIdx, hotelsRecommandes.length, 1, 296), 3500)
    return () => clearInterval(t)
  }, [hotelsRecommandes.length])

  useEffect(() => {
    const t = setInterval(() => go(scrollRefGal, setGalIdx, GALERIE_FALLBACK.length, 1, 272), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <Layout>

      {/* ===== HERO ===== */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: '720px' }}>
       <img
  src="/hero-benin%20(2).jpeg"
  alt="Bénin"
  className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02] brightness-50"
/>
        {/* Voile léger pour lisibilité du texte, image reste bien visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

        {/* Orbes décoratifs */}
        <div className="absolute top-16 right-1/4 w-[500px] h-[500px] rounded-full bg-[#F57C2B]/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-1/5 w-80 h-80 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />

        {/* Ligne orange bas */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F57C2B]/70 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-52">
          <div className="text-center mb-14">

            {/* Badge glassmorphism */}
            
          
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
              <span className="inline-block animate-fade-in-up text-[#F57C2B] drop-shadow-lg">Pharos Bénin</span>{' '}
              <span className="inline-block animate-fade-in-up text-white">est le phare</span><br />
              <span className="inline-block animate-fade-in-up animate-delay-150 text-white">de votre séjour</span>
            </h1>

            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-white/30" />
              <p className="animate-fade-in-up animate-delay-300 text-xl sm:text-2xl font-semibold text-white/85 tracking-wide">
                Votre hébergement idéal
              </p>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-white/30" />
            </div>

            <p className="animate-fade-in-up animate-delay-450 text-sm text-white/70 font-semibold tracking-[0.25em] uppercase mb-10">
              partout au Bénin
            </p>

        
            {/* Trust indicators */}
            
          </div>

          {/* Barre de recherche */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleRecherche} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/40 p-2.5 sm:p-3 border border-white/20">
              <div className="flex flex-col sm:flex-row gap-2">

                <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <MapPin size={17} className="text-[#F57C2B] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-700 font-bold block">Destination</label>
                    <input type="text" list="villes-benin" value={localite}
                      onChange={(e) => setLocalite(e.target.value)}
                      placeholder="Toutes les villes"
                      className="w-full bg-transparent text-gray-800 text-sm font-medium outline-none placeholder:text-gray-400 placeholder:font-normal" />
                    <datalist id="villes-benin">
                      {TOUTES_VILLES_BENIN.map(v => <option key={v} value={v} />)}
                    </datalist>
                  </div>
                </div>

                <div className="hidden sm:block w-px bg-gray-200 self-stretch my-2" />

                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors sm:w-44">
                  <Calendar size={17} className="text-[#F57C2B] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-700 font-bold block">Arrivée</label>
                    <input type="date" value={dateArrivee} onChange={e => { setDateArrivee(e.target.value); if (dateDepart && e.target.value >= dateDepart) setDateDepart('') }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-transparent text-gray-800 text-sm font-medium outline-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors sm:w-44">
                  <Calendar size={17} className="text-[#F57C2B] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-700 font-bold block">Départ</label>
                    <input type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)}
                      min={dateArrivee ? new Date(new Date(dateArrivee).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="w-full bg-transparent text-gray-800 text-sm font-medium outline-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors sm:w-32">
                  <Users size={17} className="text-[#F57C2B] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-700 font-bold block">Voyageurs</label>
                    <input type="number" value={voyageurs}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') { setVoyageurs(''); return }
                        setVoyageurs(Math.max(1, Math.min(20, parseInt(raw) || 1)))
                      }}
                      onBlur={() => { if (voyageurs === '') setVoyageurs(1) }}
                      onFocus={(e) => e.target.select()}
                      onMouseUp={(e) => e.preventDefault()}
                      min={1} max={20}
                      className="appearance-none w-full bg-transparent text-gray-800 text-sm font-medium outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                </div>

                <button type="submit"
                  className="bg-[#F57C2B] hover:bg-orange-600 text-white px-7 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shrink-0 shadow-lg shadow-orange-500/30">
                  <Search size={18} />
                  <span className="hidden sm:inline">Rechercher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Événements nationaux */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 mb-14 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-black/8 px-5 py-4 flex items-center gap-3 overflow-x-auto border border-gray-100/80">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#F57C2B] animate-pulse" />
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Événements</span>
          </div>
          <div className="w-px h-5 bg-gray-100 shrink-0" />
          {evenements.map((ev) => (
            <button key={ev.nom}
              onClick={() => {
                const params = new URLSearchParams({ ville: ev.lieu })
                if (ev.latitude && ev.longitude) {
                  params.set('point_interet', String(ev.id))
                  params.set('type', 'evenement')
                }
                navigate(`/recherche?${params.toString()}`)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap shrink-0 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${ev.couleur}`}>
              {ev.nom}
              <span className="opacity-40">·</span>
              {ev.date}
            </button>
          ))}
        </div>
      </section>

      {/* Hôtels Pro en vedette */}
      {hotelsPro.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-1 rounded-full bg-gradient-to-r from-[#F57C2B] to-orange-400" />
                <span className="text-xs font-black text-[#F57C2B] uppercase tracking-widest">Premium</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Établissements certifiés</h2>
              <p className="text-gray-400 text-sm mt-1">Nos partenaires sélectionnés pour la qualité de leur service</p>
            </div>
            <button onClick={() => navigate('/recherche?abonnement=pro')}
              className="flex items-center gap-2 bg-[#F57C2B]/8 hover:bg-[#F57C2B] text-[#F57C2B] hover:text-white border border-[#F57C2B]/20 hover:border-[#F57C2B] px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:shadow-lg hover:shadow-orange-500/20">
              Voir tous <ChevronRight size={15} />
            </button>
          </div>

          <div className="relative">
            <button onClick={() => go(scrollRefPro, setProIdx, Math.min(hotelsPro.length, 5), -1, 296)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white hover:bg-[#F57C2B] hover:text-white text-gray-600 rounded-full flex items-center justify-center shadow-md border border-gray-100 transition-all">
              <ChevronLeft size={16} />
            </button>

            <div ref={scrollRefPro} className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scroll-smooth scrollbar-hide">
              {hotelsPro.slice(0, 5).map(hotel => (
                <div key={hotel.id} className="w-[280px] flex-shrink-0">
                  <CarteHotel hotel={hotel} estBooste={hotel.est_booste || false} queryString={queryStringEtablissement} />
                </div>
              ))}
            </div>

            <button onClick={() => go(scrollRefPro, setProIdx, Math.min(hotelsPro.length, 5), 1, 296)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white hover:bg-[#F57C2B] hover:text-white text-gray-600 rounded-full flex items-center justify-center shadow-md border border-gray-100 transition-all">
              <ChevronRight size={16} />
            </button>

            <div className="flex justify-center gap-1.5 mt-3">
              {hotelsPro.slice(0, 5).map((_, i) => (
                <button key={i} onClick={() => { setProIdx(i); scrollTo(scrollRefPro, i, 296) }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === proIdx ? 'w-5 bg-[#F57C2B]' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Galerie — fond sombre premium */}
      <section className="bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* Header */}
        <div className="relative pt-7 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#F57C2B]" />
              <span className="text-xs font-black text-[#F57C2B] uppercase tracking-widest">Galerie</span>
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#F57C2B]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Un aperçu de nos établissements</h2>
            <p className="text-white/35 text-sm">Photos de nos hôtels partenaires au Bénin</p>
          </div>
        </div>

        {/* Scroll horizontal toutes tailles */}
        <div className="relative px-4">
          <button onClick={() => go(scrollRefGal, setGalIdx, GALERIE_FALLBACK.length, -1, 272)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/15 hover:bg-[#F57C2B] text-white rounded-full flex items-center justify-center shadow-md border border-white/20 transition-all">
            <ChevronLeft size={16} />
          </button>

          <div ref={scrollRefGal} className="flex gap-3 overflow-x-auto pb-3 scroll-smooth scrollbar-hide">
            {GALERIE_FALLBACK.map((photo, i) => (
              <div key={i} className="w-[260px] flex-shrink-0 rounded-2xl overflow-hidden group relative">
                <img src={photo} alt=""
                  className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
              </div>
            ))}
          </div>

          <button onClick={() => go(scrollRefGal, setGalIdx, GALERIE_FALLBACK.length, 1, 272)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/15 hover:bg-[#F57C2B] text-white rounded-full flex items-center justify-center shadow-md border border-white/20 transition-all">
            <ChevronRight size={16} />
          </button>

          <div className="flex justify-center gap-1.5 mt-3">
            {GALERIE_FALLBACK.map((_, i) => (
              <button key={i} onClick={() => { setGalIdx(i); scrollTo(scrollRefGal, i, 272) }}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === galIdx ? 'w-5 bg-[#F57C2B]' : 'w-1.5 bg-white/25 hover:bg-white/50'}`} />
            ))}
          </div>
        </div>

        {/* Bouton */}
        <div className="relative text-center pt-4 pb-7">
          <button onClick={() => navigate('/recherche')}
            className="bg-gradient-to-r from-[#C4621E] to-[#a0511a] hover:from-[#b55a1a] hover:to-[#8f4715] text-white font-black px-12 py-4 rounded-xl transition-all inline-flex items-center gap-2.5 shadow-lg shadow-black/25 hover:shadow-black/35 hover:scale-[1.02] active:scale-[0.99]">
            Explorer tous les hébergements
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Hébergements recommandés */}
      <section className="py-12 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Sélection</span>
              <div className="w-8 h-1 rounded-full bg-gradient-to-l from-blue-600 to-blue-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Hébergements recommandés</h2>
            <p className="text-gray-400 text-xs mt-1">Sélectionnés pour la qualité et les avis clients</p>
            <button onClick={() => navigate('/recherche')}
              className="mt-3 inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 px-4 py-2 rounded-xl text-xs font-black transition-all">
              Tout voir <ChevronRight size={13} />
            </button>
          </div>
          {hotelsRecommandes.length > 0 ? (
            <div className="relative">
              <button onClick={() => go(scrollRefRec, setRecIdx, hotelsRecommandes.length, -1, 296)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white hover:bg-blue-600 hover:text-white text-gray-600 rounded-full flex items-center justify-center shadow-md border border-gray-100 transition-all">
                <ChevronLeft size={16} />
              </button>

              <div ref={scrollRefRec} className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scroll-smooth scrollbar-hide">
                {hotelsRecommandes.map(hotel => (
                  <div key={hotel.id} className="w-[280px] flex-shrink-0">
                    <CarteHotel hotel={hotel} estBooste={hotel.est_booste || false} queryString={queryStringEtablissement} />
                  </div>
                ))}
              </div>

              <button onClick={() => go(scrollRefRec, setRecIdx, hotelsRecommandes.length, 1, 296)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white hover:bg-blue-600 hover:text-white text-gray-600 rounded-full flex items-center justify-center shadow-md border border-gray-100 transition-all">
                <ChevronRight size={16} />
              </button>

              <div className="flex justify-center gap-1.5 mt-3">
                {hotelsRecommandes.map((_, i) => (
                  <button key={i} onClick={() => { setRecIdx(i); scrollTo(scrollRefRec, i, 296) }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === recIdx ? 'w-5 bg-blue-600' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <Building2 size={32} className="text-gray-200" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Chargement des hébergements...</p>
            </div>
          )}
        </div>
      </section>

      {/* Pourquoi PHAROS — fond navy premium */}
      <section className="bg-[#0D1B40] py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F57C2B]/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-6 h-px bg-gradient-to-r from-transparent to-[#F57C2B]" />
              <span className="text-xs font-black text-[#F57C2B] uppercase tracking-widest">Nos avantages</span>
              <div className="w-6 h-px bg-gradient-to-l from-transparent to-[#F57C2B]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Pourquoi choisir PHAROS Bénin ?</h2>
            <p className="text-white/40 max-w-xl mx-auto text-xs leading-relaxed">La seule solution de réservation hôtelière pensée pour les réalités béninoises</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <Smartphone size={22} className="text-[#F57C2B]" />,
                iconBg: 'bg-[#F57C2B]/10 border-[#F57C2B]/20',
                accentFrom: 'from-[#F57C2B]/15',
                titre: 'Paiement Mobile Money',
                texte: 'Réglez avec MTN Mobile Money ou Moov Money. Aucune carte bancaire requise.',
              },
              {
                icon: <QrCode size={22} className="text-blue-400" />,
                iconBg: 'bg-blue-500/10 border-blue-500/20',
                accentFrom: 'from-blue-500/15',
                titre: 'Check-in par QR Code',
                texte: 'Recevez votre QR Code après confirmation et enregistrez-vous instantanément.',
              },
              {
                icon: <Shield size={22} className="text-emerald-400" />,
                iconBg: 'bg-emerald-500/10 border-emerald-500/20',
                accentFrom: 'from-emerald-500/15',
                titre: 'Paiement sécurisé Escrow',
                texte: 'Vos fonds sont conservés par PHAROS jusqu\'à la fin du séjour. Remboursement garanti.',
              },
            ].map(item => (
              <div key={item.titre} className="relative bg-white/5 border border-white/10 p-5 rounded-xl hover:bg-white/8 transition-all group overflow-hidden flex gap-4 items-start">
                <div className={`relative w-11 h-11 rounded-xl border ${item.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-black text-white text-sm mb-1">{item.titre}</h3>
                  <p className="text-white/45 text-xs leading-relaxed">{item.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avis clients — premium */}
      <section className="py-12 bg-gray-50 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-6 h-px bg-gradient-to-r from-transparent to-[#F57C2B]" />
              <span className="text-xs font-black text-[#F57C2B] uppercase tracking-widest">Témoignages</span>
              <div className="w-6 h-px bg-gradient-to-l from-transparent to-[#F57C2B]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Ce que disent nos clients</h2>
            <p className="text-gray-400 text-xs">Avis vérifiés de voyageurs ayant séjourné via PHAROS</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVIS_STATIQUES.map((avis, i) => (
              <div key={i} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F57C2B]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Giant quote mark */}
                <span className="absolute -top-2 right-4 text-9xl font-black text-[#F57C2B]/5 leading-none select-none pointer-events-none">"</span>

                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className={j < avis.note ? 'fill-[#F57C2B] text-[#F57C2B]' : 'fill-gray-100 text-gray-100'} />
                  ))}
                  <span className="ml-2 text-xs text-gray-400 font-bold">5.0</span>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-4 relative">"{avis.texte}"</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0D1B40] to-[#1a3060] rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-black text-sm">{avis.auteur.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{avis.auteur}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={9} /> {avis.ville}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#F57C2B] font-black bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full">{avis.hotel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section fusionnée : Stats + CTA hôtelier */}
      <section className="relative py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B40] via-[#7A3510] to-[#C4621E]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#F57C2B]/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-white">

          {/* Haut : texte gauche + stats plateforme droite */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-10">

            {/* Colonne gauche — CTA */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#F57C2B]/20 border border-[#F57C2B]/30 text-[#F57C2B] text-xs font-black px-3 py-1.5 rounded-full mb-4 tracking-widest uppercase">
                Rejoignez PHAROS
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                Développez votre activité<br />
                <span className="text-[#F57C2B]">avec PHAROS Bénin</span>
              </h2>
              <p className="text-white/65 mb-6 leading-relaxed text-sm">
                Rejoignez la première plateforme hôtelière béninoise. Gérez vos réservations depuis un tableau de bord simple et efficace. Commission à partir de 3% seulement.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <a href="/inscription-hotelier"
                  className="bg-white text-[#F57C2B] font-black px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.99] text-sm">
                  Inscrire mon établissement
                </a>
                <a href="/regles"
                  className="group flex items-center gap-1.5 text-white/80 font-bold text-sm hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 px-6 py-3.5 rounded-xl transition-all">
                  En savoir plus
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Colonne droite — vraies stats plateforme */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((s, i) => (
                <div key={s.label} className="bg-white/8 border border-white/10 rounded-2xl px-5 py-5 hover:bg-white/12 transition-colors group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#F57C2B]/15 border border-[#F57C2B]/25 flex items-center justify-center group-hover:bg-[#F57C2B]/25 transition-colors">
                      {STATS_ICONS[i]}
                    </div>
                  </div>
                  <p className="text-3xl font-black text-[#F57C2B] leading-none">{s.valeur}</p>
                  <p className="text-xs text-white/45 font-bold uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

    </Layout>
  )
}

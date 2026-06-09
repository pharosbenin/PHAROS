import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Calendar, Users, Star, ChevronRight, Shield, Smartphone, QrCode, Building2 } from 'lucide-react'
import Layout from '../../components/common/Layout'
import CarteHotel from '../../components/common/CarteHotel'
import api from '../../services/api'

const BACKEND_URL = 'http://localhost:8000'
function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BACKEND_URL + path
}

const VILLES_BENIN = [
  'Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou',
  'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Natitingou',
  'Dassa-Zoumè', 'Abomey', 'Nikki', 'Malanville'
]

const EVENEMENTS = [
  { nom: 'Fête du Vodun', date: '10 Jan', lieu: 'Ouidah', couleur: 'bg-purple-50 text-purple-700 border-purple-200' },
  { nom: 'Pèlerinage de Dassa', date: '15 Août', lieu: 'Dassa-Zoumè', couleur: 'bg-blue-50 text-blue-700 border-blue-200' },
  { nom: 'Festival Weloveya', date: 'Décembre', lieu: 'Cotonou', couleur: 'bg-green-50 text-green-700 border-green-200' },
  { nom: 'Fête Nationale', date: '1er Août', lieu: 'Porto-Novo', couleur: 'bg-amber-50 text-amber-700 border-amber-200' },
]

const STATS = [
  { valeur: '200+', label: 'Établissements' },
  { valeur: '15 000+', label: 'Réservations' },
  { valeur: '12 villes', label: 'Au Bénin' },
  { valeur: '4.7 / 5', label: 'Note moyenne' },
]

const PHOTOS_HOTELS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&auto=format&fit=crop',
]

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

  useEffect(() => {
    api.get('/hotels/')
      .then(res => setHotels(res.data.map(normaliserHotel)))
      .catch(() => setHotels([]))
  }, [])

  const handleRecherche = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (localite) params.set('ville', localite)
    if (dateArrivee) params.set('arrivee', dateArrivee)
    if (dateDepart) params.set('depart', dateDepart)
    params.set('voyageurs', voyageurs)
    navigate(`/recherche?${params.toString()}`)
  }

  const hotelsPro = hotels.filter(h => h.abonnement === 'pro')
  const hotelsRecommandes = hotels.slice(0, 4)

  return (
    <Layout>

      {/* ===== HERO ===== */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: '580px' }}>
        <img
          src="/hero-benin.jpeg"
          alt="Bénin"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/70" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-40">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-white/80 tracking-widest uppercase mb-4">
              La plateforme hôtelière n°1 au Bénin
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 leading-tight">
              Votre hébergement idéal<br />
              <span className="text-yellow-300">partout au Bénin</span>
            </h1>
            <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
              Réservez en quelques clics, payez avec Mobile Money
              et accédez à votre hôtel avec un simple QR Code.
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleRecherche} className="bg-white rounded-2xl shadow-2xl p-2.5 sm:p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <MapPin size={17} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-400 font-semibold block">Destination</label>
                    <select value={localite} onChange={(e) => setLocalite(e.target.value)}
                      className="w-full bg-transparent text-gray-800 text-sm font-medium outline-none cursor-pointer">
                      <option value="">Toutes les villes</option>
                      {VILLES_BENIN.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="hidden sm:block w-px bg-gray-200 self-stretch my-2" />

                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors sm:w-44">
                  <Calendar size={17} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-400 font-semibold block">Arrivée</label>
                    <input type="date" value={dateArrivee} onChange={(e) => setDateArrivee(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-transparent text-gray-800 text-sm font-medium outline-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors sm:w-44">
                  <Calendar size={17} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-400 font-semibold block">Départ</label>
                    <input type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)}
                      min={dateArrivee || new Date().toISOString().split('T')[0]}
                      className="w-full bg-transparent text-gray-800 text-sm font-medium outline-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors sm:w-32">
                  <Users size={17} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-400 font-semibold block">Voyageurs</label>
                    <input type="number" value={voyageurs}
                      onChange={(e) => setVoyageurs(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1} max={20}
                      className="w-full bg-transparent text-gray-800 text-sm font-medium outline-none" />
                  </div>
                </div>

                <button type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shrink-0">
                  <Search size={18} />
                  <span className="hidden sm:inline">Rechercher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Événements nationaux */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-md px-5 py-3 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">Événements</span>
          {EVENEMENTS.map((ev) => (
            <button key={ev.nom}
              onClick={() => navigate(`/recherche?ville=${ev.lieu}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap shrink-0 hover:shadow-sm transition-all ${ev.couleur}`}>
              {ev.nom} · {ev.date}
            </button>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 py-10 mb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-black text-gray-900 mb-1">{s.valeur}</p>
                <p className="text-sm text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hôtels Pro en vedette */}
      {hotelsPro.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Établissements certifiés</h2>
              <p className="text-gray-400 text-sm mt-0.5">Nos partenaires sélectionnés pour la qualité de leur service</p>
            </div>
            <button onClick={() => navigate('/recherche?abonnement=pro')}
              className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline">
              Voir tous <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {hotelsPro.slice(0, 2).map((hotel, idx) => {
              const photo = mediaUrl(hotel.photo_principale) || PHOTOS_HOTELS[idx % PHOTOS_HOTELS.length]
              return (
                <div key={hotel.id}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300"
                  onClick={() => navigate(`/etablissement/${hotel.id}`)}>
                  <img src={photo} alt={hotel.nom}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded mb-2">
                          Partenaire certifié
                        </span>
                        <h3 className="text-white font-black text-xl mb-1">{hotel.nom}</h3>
                        <p className="text-white/70 text-sm flex items-center gap-1">
                          <MapPin size={11} /> {hotel.localisation || hotel.adresse || ''}{hotel.ville ? `, ${hotel.ville}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {hotel.note_moyenne > 0 && (
                          <div className="flex items-center gap-1 justify-end mb-1">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span className="text-white font-bold text-sm">{hotel.note_moyenne.toFixed(1)}</span>
                          </div>
                        )}
                        {hotel.prix_min && (
                          <p className="text-white font-bold">{hotel.prix_min.toLocaleString()} <span className="text-xs font-normal text-white/60">FCFA/nuit</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {hotelsPro.length > 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {hotelsPro.slice(2, 5).map(hotel => (
                <CarteHotel key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Galerie */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-2">Un aperçu de nos établissements</h2>
          <p className="text-gray-400 text-sm text-center mb-8">Photos de nos hôtels partenaires au Bénin</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {GALERIE_FALLBACK.map((photo, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-xl">
                <img src={photo} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" />
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => navigate('/recherche')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
              Explorer tous les hébergements
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Tous les hébergements recommandés */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Hébergements recommandés</h2>
              <p className="text-gray-400 text-sm mt-0.5">Sélectionnés pour la qualité et les avis clients</p>
            </div>
            <button onClick={() => navigate('/recherche')}
              className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline">
              Tout voir <ChevronRight size={15} />
            </button>
          </div>
          {hotelsRecommandes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {hotelsRecommandes.map(hotel => <CarteHotel key={hotel.id} hotel={hotel} />)}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
              <p>Chargement des hébergements...</p>
            </div>
          )}
        </div>
      </section>

      {/* Pourquoi PHAROS */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Pourquoi choisir PHAROS Bénin ?</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto text-sm">La seule solution de réservation hôtelière pensée pour les réalités béninoises</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone size={26} className="text-amber-600" />,
                titre: 'Paiement Mobile Money',
                texte: 'Réglez votre réservation avec MTN Mobile Money ou Moov Money. Aucune carte bancaire requise.',
              },
              {
                icon: <QrCode size={26} className="text-blue-600" />,
                titre: 'Check-in par QR Code',
                texte: 'Recevez votre QR Code après confirmation. Présentez-le à la réception pour vous enregistrer instantanément.',
              },
              {
                icon: <Shield size={26} className="text-green-600" />,
                titre: 'Paiement sécurisé Escrow',
                texte: 'Vos fonds sont conservés par PHAROS jusqu\'à la fin de votre séjour. Remboursement garanti en cas de problème.',
              },
            ].map(item => (
              <div key={item.titre} className="bg-white p-7 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{item.titre}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avis clients */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">Ce que disent nos clients</h2>
            <p className="text-gray-400 mt-2 text-sm">Avis vérifiés de voyageurs ayant séjourné via PHAROS</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AVIS_STATIQUES.map((avis, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className={j < avis.note ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{avis.texte}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{avis.auteur.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{avis.auteur}</p>
                      <p className="text-xs text-gray-400">{avis.ville}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{avis.hotel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA hôtelier */}
      <section className="bg-blue-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Vous êtes hôtelier au Bénin ?</h2>
          <p className="text-blue-100 mb-8 leading-relaxed">
            Rejoignez PHAROS et augmentez votre visibilité en ligne. Gérez vos réservations depuis un tableau de bord simple et efficace. Commission à partir de 3% seulement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/inscription-hotelier"
              className="bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors">
              Inscrire mon établissement
            </a>
            <a href="/inscription-hotelier"
              className="text-white/80 font-medium text-sm hover:text-white transition-colors">
              En savoir plus sur les abonnements →
            </a>
          </div>
        </div>
      </section>

    </Layout>
  )
}

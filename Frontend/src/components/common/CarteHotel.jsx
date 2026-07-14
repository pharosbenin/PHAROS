import { Link } from 'react-router-dom'
import { Star, MapPin, Wifi, Car, Coffee, Waves, Heart, Navigation } from 'lucide-react'

const BACKEND_URL = 'http://localhost:8000'
function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BACKEND_URL + path
}

const PHOTOS_FALLBACK = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop',
]

const ICONES_EQ = {
  wifi: <Wifi size={11} />,
  parking: <Car size={11} />,
  restaurant: <Coffee size={11} />,
  piscine: <Waves size={11} />,
}

const LABELS_EQ = { wifi: 'WiFi', parking: 'Parking', restaurant: 'Restaurant', piscine: 'Piscine' }

function formaterDistance(km) {
  if (!km && km !== 0) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

function NoteBadge({ note }) {
  const n = parseFloat(note) || 0
  const couleur = n >= 4.5 ? 'bg-emerald-500' : n >= 4.0 ? 'bg-blue-600' : 'bg-amber-500'
  const label = n >= 4.5 ? 'Exceptionnel' : n >= 4.0 ? 'Très bien' : 'Bien'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${couleur} text-white text-xs font-black px-2 py-0.5 rounded-md shadow-sm`}>{n.toFixed(1)}</span>
      <span className="text-xs text-gray-400 font-semibold">{label}</span>
    </div>
  )
}

export default function CarteHotel({ hotel, vue = 'grille', estBooste = false, queryString = '' }) {
  const {
    id, nom, localisation, ville, prix_min, prix_min_original, a_promotion,
    note_moyenne, nb_avis, abonnement, equipements = [], etoiles, photo_principale,
    distance_km
  } = hotel

  const note = parseFloat(note_moyenne) || 0
  const photo = mediaUrl(photo_principale) || PHOTOS_FALLBACK[id % PHOTOS_FALLBACK.length]
  const lienEtablissement = `/etablissement/${id}${queryString ? `?${queryString}` : ''}`

  if (vue === 'liste') {
    return (
      <Link to={lienEtablissement} className="group flex bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Photo */}
        <div className="relative w-56 shrink-0 overflow-hidden">
          <img src={photo} alt={nom} className="w-full h-full min-h-[160px] object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {estBooste ? (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
              ⭐ En vedette
            </span>
          ) : abonnement === 'pro' && (
            <span className="absolute top-3 left-3 bg-[#F57C2B] text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
              Pro
            </span>
          )}
          {distance_km != null && (
            <span className="absolute bottom-3 left-3 bg-[#0D1B40]/80 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Navigation size={10} />
              {formaterDistance(distance_km)}
            </span>
          )}
        </div>

        {/* Contenu */}
        <div className="flex flex-1 min-w-0 p-5 justify-between gap-4">
          <div className="flex-1 min-w-0">
            {etoiles > 0 && (
              <div className="flex items-center gap-0.5 mb-1.5">
                {[...Array(etoiles)].map((_, i) => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}
              </div>
            )}
            <h3 className="font-black text-gray-900 group-hover:text-[#F57C2B] transition-colors text-lg truncate">{nom}</h3>
            <div className="flex items-center gap-1 text-gray-400 text-sm mt-0.5 mb-3">
              <MapPin size={13} className="text-[#F57C2B] shrink-0" />
              <span className="truncate">{localisation || ville}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {equipements.slice(0, 4).map(eq => LABELS_EQ[eq] && (
                <span key={eq} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg font-medium">
                  {ICONES_EQ[eq]} {LABELS_EQ[eq]}
                </span>
              ))}
            </div>
            {note > 0 && <NoteBadge note={note} />}
          </div>

          <div className="text-right shrink-0 flex flex-col justify-between">
            <button className="p-1.5 rounded-xl hover:bg-red-50 transition-colors self-end">
              <Heart size={18} className="text-gray-200 hover:text-red-400 transition-colors" />
            </button>
            <div>
              {nb_avis > 0 && <p className="text-xs text-gray-400 mb-1.5 font-medium">{nb_avis} avis</p>}
              {a_promotion && <span className="inline-block bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full mb-1.5 shadow-sm">Promo</span>}
              <p className="text-xs text-gray-400 font-medium">à partir de</p>
              {a_promotion && prix_min_original && (
                <p className="text-xs text-gray-300 line-through">{Math.round(prix_min_original).toLocaleString()} FCFA</p>
              )}
              <p className="text-xl font-black text-red-500">{Math.round(prix_min)?.toLocaleString()}<span className="text-sm font-semibold text-gray-400"> FCFA</span></p>
              <p className="text-xs text-gray-400">/nuit</p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={lienEtablissement} className="group block bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Photo */}
      <div className="relative h-52 overflow-hidden">
        <img src={photo} alt={nom} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-600 ease-out" style={{ transitionDuration: '600ms' }} />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F57C2B] to-orange-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />

        {estBooste ? (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
            ⭐ En vedette
          </span>
        ) : abonnement === 'pro' && (
          <span className="absolute top-3 left-3 bg-[#F57C2B] text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
            Partenaire certifié
          </span>
        )}

        <button
          onClick={(e) => { e.preventDefault() }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-md"
        >
          <Heart size={14} className="text-gray-300 hover:text-red-500 transition-colors" />
        </button>

        {distance_km != null && (
          <span className="absolute bottom-3 left-3 bg-[#0D1B40]/80 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Navigation size={10} />
            {formaterDistance(distance_km)}
          </span>
        )}

        {a_promotion && (
          <span className="absolute bottom-12 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
            Promo
          </span>
        )}

        {/* Prix badge */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg text-right border border-white/50">
          {a_promotion && prix_min_original && (
            <p className="text-xs text-gray-400 line-through leading-none">{Math.round(prix_min_original).toLocaleString()} FCFA</p>
          )}
          <span className={`text-sm font-black ${a_promotion ? 'text-red-500' : 'text-[#0D1B40]'}`}>{Math.round(prix_min)?.toLocaleString()} FCFA</span>
          <span className="text-xs text-gray-400 font-medium">/nuit</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {etoiles > 0 && (
          <div className="flex items-center gap-0.5 mb-1.5">
            {[...Array(etoiles)].map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-black text-gray-900 group-hover:text-[#F57C2B] transition-colors line-clamp-1 text-base">
            {nom}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-gray-400 mb-3">
          <MapPin size={12} className="text-[#F57C2B] shrink-0" />
          <span className="truncate text-xs font-medium">{localisation || ville}</span>
        </div>

        <div className="flex items-center justify-between">
          {note > 0 ? (
            <NoteBadge note={note} />
          ) : <span />}
          {nb_avis > 0 && (
            <span className="text-xs text-gray-400 font-medium">{nb_avis} avis</span>
          )}
        </div>

        {equipements.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-gray-50">
            {equipements.slice(0, 3).map(eq => LABELS_EQ[eq] && (
              <span key={eq} className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg font-medium">
                {ICONES_EQ[eq]} {LABELS_EQ[eq]}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

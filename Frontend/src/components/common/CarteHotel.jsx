import { Link } from 'react-router-dom'
import { Star, MapPin, Wifi, Car, Coffee, Waves, Heart } from 'lucide-react'

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

function NoteBadge({ note }) {
  const n = parseFloat(note) || 0
  const couleur = n >= 4.5 ? 'bg-green-600' : n >= 4.0 ? 'bg-blue-600' : 'bg-amber-500'
  const label = n >= 4.5 ? 'Exceptionnel' : n >= 4.0 ? 'Très bien' : 'Bien'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${couleur} text-white text-xs font-bold px-2 py-1 rounded-md`}>{n.toFixed(1)}</span>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  )
}

export default function CarteHotel({ hotel, vue = 'grille' }) {
  const {
    id, nom, localisation, ville, prix_min, note_moyenne, nb_avis,
    abonnement, equipements = [], etoiles, photo_principale
  } = hotel

  const note = parseFloat(note_moyenne) || 0
  const photo = mediaUrl(photo_principale) || PHOTOS_FALLBACK[id % PHOTOS_FALLBACK.length]

  if (vue === 'liste') {
    return (
      <Link to={`/etablissement/${id}`} className="group flex bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all overflow-hidden">
        {/* Photo */}
        <div className="relative w-56 shrink-0 overflow-hidden">
          <img src={photo} alt={nom} className="w-full h-full min-h-[160px] object-cover group-hover:scale-105 transition-transform duration-300" />
          {abonnement === 'pro' && (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Pro
            </span>
          )}
        </div>

        {/* Contenu */}
        <div className="flex flex-1 min-w-0 p-4 justify-between gap-4">
          <div className="flex-1 min-w-0">
            {etoiles > 0 && (
              <div className="flex items-center gap-0.5 mb-1">
                {[...Array(etoiles)].map((_, i) => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}
              </div>
            )}
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg truncate">{nom}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5 mb-3">
              <MapPin size={13} />
              <span className="truncate">{localisation || ville}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {equipements.slice(0, 4).map(eq => LABELS_EQ[eq] && (
                <span key={eq} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                  {ICONES_EQ[eq]} {LABELS_EQ[eq]}
                </span>
              ))}
            </div>
            {note > 0 && <NoteBadge note={note} />}
          </div>

          <div className="text-right shrink-0 flex flex-col justify-between">
            <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors self-end">
              <Heart size={18} className="text-gray-300 hover:text-red-400" />
            </button>
            <div>
              {nb_avis > 0 && <p className="text-xs text-gray-400 mb-1">{nb_avis} avis</p>}
              <p className="text-xs text-gray-400">à partir de</p>
              <p className="text-xl font-bold text-blue-700">{prix_min?.toLocaleString()}<span className="text-sm font-normal"> FCFA</span></p>
              <p className="text-xs text-gray-400">/nuit</p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/etablissement/${id}`} className="group block bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all overflow-hidden">
      {/* Photo */}
      <div className="relative h-52 overflow-hidden">
        <img src={photo} alt={nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

        {abonnement === 'pro' && (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            Partenaire certifié
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault() }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          <Heart size={15} className="text-gray-400 hover:text-red-500 transition-colors" />
        </button>

        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm">
          <span className="text-sm font-bold text-blue-700">{prix_min?.toLocaleString()} FCFA</span>
          <span className="text-xs text-gray-500">/nuit</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {etoiles > 0 && (
          <div className="flex items-center gap-0.5 mb-1">
            {[...Array(etoiles)].map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-base">
            {nom}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
          <MapPin size={12} />
          <span className="truncate text-xs">{localisation || ville}</span>
        </div>

        <div className="flex items-center justify-between">
          {note > 0 ? (
            <NoteBadge note={note} />
          ) : <span />}
          {nb_avis > 0 && (
            <span className="text-xs text-gray-400">{nb_avis} avis</span>
          )}
        </div>

        {equipements.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-gray-50">
            {equipements.slice(0, 3).map(eq => LABELS_EQ[eq] && (
              <span key={eq} className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                {ICONES_EQ[eq]} {LABELS_EQ[eq]}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, AlertCircle, MapPin, Navigation, Clock, Pill, Cross, Fuel, ShoppingCart, Wrench, Compass, Info } from 'lucide-react'
import { getMonSejour } from '../../services/assistance'

const ICONES = {
  pill: Pill,
  cross: Cross,
  fuel: Fuel,
  'shopping-cart': ShoppingCart,
  wrench: Wrench,
}

export default function AssistanceVoyageur({ numeroReservation, email, onFermer }) {
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [donnees, setDonnees] = useState(null)
  const [ongletActif, setOngletActif] = useState(null)

  useEffect(() => {
    getMonSejour(numeroReservation, email)
      .then(data => {
        setDonnees(data)
        if (data.categories.length > 0) setOngletActif(data.categories[0].categorie.code)
      })
      .catch(err => setErreur(err.response?.data?.detail || "Impossible de charger l'assistance voyageur."))
      .finally(() => setChargement(false))
  }, [numeroReservation, email])

  const blocActif = donnees?.categories.find(c => c.categorie.code === ongletActif)

  // Portail vers document.body : évite que la modale (position: fixed) reste
  // piégée si un ancêtre (ex: la carte réservation, overflow-hidden) limite son affichage.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Compass size={18} className="text-teal-600" /> Mon Séjour
            </h2>
            {donnees && (
              <p className="text-xs text-gray-400 mt-0.5">
                Services à proximité de {donnees.hotel_nom} · {donnees.hotel_ville} (rayon {donnees.rayon_utilise} km)
              </p>
            )}
          </div>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto p-6">
          {chargement && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Loader2 size={24} className="animate-spin mb-2" />
              <p className="text-sm">Recherche des services à proximité...</p>
            </div>
          )}

          {!chargement && erreur && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{erreur}</p>
            </div>
          )}

          {!chargement && !erreur && donnees && donnees.categories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
              <MapPin size={28} className="mb-2 text-gray-200" />
              <p className="text-sm">Aucun service référencé pour le moment autour de cet hôtel.</p>
            </div>
          )}

          {!chargement && !erreur && donnees && donnees.categories.length > 0 && (
            <>
              {donnees.rayon_etendu && (
                <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Peu de services référencés autour de cet hôtel — voici les plus proches dans un rayon élargi de {donnees.rayon_utilise} km.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {donnees.categories.map(bloc => {
                  const Icone = ICONES[bloc.categorie.icone] || MapPin
                  const actif = bloc.categorie.code === ongletActif
                  return (
                    <button key={bloc.categorie.code} onClick={() => setOngletActif(bloc.categorie.code)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        actif ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}>
                      <Icone size={12} /> {bloc.categorie.nom} ({bloc.services.length})
                    </button>
                  )
                })}
              </div>

              {blocActif && (
                <div className="space-y-2.5">
                  {blocActif.services.map(service => (
                    <div key={service.id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{service.nom}</p>
                          {service.adresse && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {service.adresse}
                            </p>
                          )}
                          {service.horaires && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} /> {service.horaires}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-teal-600 shrink-0">{service.distance_km} km</span>
                      </div>
                      <a href={service.itineraire_url} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                        <Navigation size={11} /> Itinéraire
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

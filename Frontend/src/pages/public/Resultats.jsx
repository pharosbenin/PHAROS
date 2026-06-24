import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, MapPin, SlidersHorizontal, Grid3X3, List, X, Star, ChevronDown, Filter, Loader2, Navigation, Landmark, TreePine, Church, Sword } from 'lucide-react'
import Layout from '../../components/common/Layout'
import CarteHotel from '../../components/common/CarteHotel'
import api from '../../services/api'

const VILLES_BENIN = [
  // Littoral
  'Cotonou',
  // Ouémé
  'Porto-Novo', 'Adjohoun', 'Akpro-Missérété', 'Avrankou', 'Bonou', 'Dangbo', 'Missérété', 'Sèmè-Kpodji',
  // Atlantique
  'Abomey-Calavi', 'Allada', 'Ouidah', 'Kpomassè', 'Sô-Ava', 'Toffo', 'Tori-Bossito', 'Zè',
  // Borgou
  'Parakou', 'Bembèrèkè', 'Kalalé', "N'Dali", 'Nikki', 'Pèrèrè', 'Sinendé', 'Tchaourou',
  // Zou
  'Abomey', 'Bohicon', 'Agbangnizoun', 'Covè', 'Djidja', 'Ouinhi', 'Zagnanado', 'Za-Kpota', 'Zogbodomè',
  // Collines
  'Dassa-Zoumè', 'Glazoué', 'Bantè', 'Ouèssè', 'Savalou', 'Savè',
  // Atacora
  'Natitingou', 'Boukoumbé', 'Cobly', 'Copargo', 'Kérou', 'Kouandé', 'Matéri', 'Péhunco', 'Tanguiéta', 'Toukountouna',
  // Alibori
  'Malanville', 'Banikoara', 'Gogounou', 'Kandi', 'Karimama', 'Ségbana',
  // Donga
  'Djougou', 'Bassila', 'Ouaké',
  // Mono
  'Lokossa', 'Athiémé', 'Bopa', 'Comè', 'Grand-Popo', 'Houéyogbé',
  // Couffo
  'Aplahoué', 'Djakotomey', 'Dogbo', 'Klouékanmè', 'Lalo', 'Toviklin',
  // Plateau
  'Kétou', 'Pobè', 'Sakété', 'Adja-Ouèrè', 'Ifangni',
]

export default function Resultats() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [ville, setVille] = useState(searchParams.get('ville') || '')
  const [dateArrivee, setDateArrivee] = useState(searchParams.get('arrivee') || '')
  const [dateDepart, setDateDepart] = useState(searchParams.get('depart') || '')
  const [voyageurs] = useState(searchParams.get('voyageurs') || 1)
  const [tri, setTri] = useState('popularite')
  const [vueGrille, setVueGrille] = useState(true)
  const [filtresOuverts, setFiltresOuverts] = useState(false)
  const [filtres, setFiltres] = useState({ equipements: [], type: '', etoilesMin: 0, restauration: false, prixMax: 0, nbPersonnes: 0 })
  const [hotels, setHotels] = useState([])
  const [evenements, setEvenements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [pointsInteret, setPointsInteret] = useState([])
  const [pointActif, setPointActif] = useState(
    searchParams.get('point_interet')
      ? { id: searchParams.get('point_interet'), type: searchParams.get('type') }
      : null
  )

  const chargerHotels = () => {
    setChargement(true)
    const params = {}
    if (ville) params.ville = ville
    if (searchParams.get('q')) params.q = searchParams.get('q')
    if (pointActif) {
      params.point_interet = pointActif.id
      params.type = pointActif.type
    }
    api.get('/hotels/', { params })
      .then(res => {
        let data = res.data.map(h => ({
          ...h,
          prix_min: h.prix_min,
          prix_min_original: h.prix_min_original,
          a_promotion: h.a_promotion || false,
          note_moyenne: parseFloat(h.note_moyenne) || 0,
          nb_avis: h.nombre_avis || 0,
          abonnement: h.type_abonnement,
          localisation: h.quartier || h.adresse || '',
          equipements: h.equipements || [],
        }))
        if (tri === 'prix_asc') data.sort((a, b) => (a.prix_min || 0) - (b.prix_min || 0))
        else if (tri === 'prix_desc') data.sort((a, b) => (b.prix_min || 0) - (a.prix_min || 0))
        else if (tri === 'note') data.sort((a, b) => (b.note_moyenne || 0) - (a.note_moyenne || 0))
        setHotels(data)
      })
      .catch(() => setHotels([]))
      .finally(() => setChargement(false))
  }

  useEffect(() => { chargerHotels() }, [ville, tri, pointActif])

  useEffect(() => {
    if (!ville) { setEvenements([]); return }
    api.get('/evenements/', { params: { ville } })
      .then(res => setEvenements(res.data.filter(e => e.est_en_cours)))
      .catch(() => setEvenements([]))
  }, [ville])

  useEffect(() => {
    if (!ville) { setPointsInteret([]); return }
    api.get(`/villes/${encodeURIComponent(ville)}/points-interet/`)
      .then(res => setPointsInteret(res.data || []))
      .catch(() => setPointsInteret([]))
  }, [ville])

  const hotelsFiltres = hotels.filter(h => {
    if (filtres.type && h.type_etablissement !== filtres.type) return false
    if (filtres.etoilesMin > 0 && (h.note_moyenne || 0) < filtres.etoilesMin) return false
    if (filtres.equipements.length > 0) {
      const eq = (h.equipements || []).map(e => String(e).toLowerCase())
      if (!filtres.equipements.every(f => eq.includes(f))) return false
    }
    if (filtres.restauration && h.abonnement !== 'pro') return false
    if (filtres.prixMax > 0 && (h.prix_min || 0) > filtres.prixMax) return false
    if (filtres.nbPersonnes > 0 && (h.capacite_max || 0) < filtres.nbPersonnes) return false
    return true
  })

  const toggleEquipement = (eq) => {
    setFiltres(prev => ({
      ...prev,
      equipements: prev.equipements.includes(eq)
        ? prev.equipements.filter(e => e !== eq)
        : [...prev.equipements, eq]
    }))
  }

  const nbFiltresActifs = filtres.equipements.length + (filtres.type ? 1 : 0) + (filtres.etoilesMin > 0 ? 1 : 0) + (filtres.restauration ? 1 : 0) + (filtres.prixMax > 0 ? 1 : 0) + (filtres.nbPersonnes > 0 ? 1 : 0)

  const reinitialiserFiltres = () => setFiltres({ equipements: [], type: '', etoilesMin: 0, restauration: false, prixMax: 0, nbPersonnes: 0 })

  function iconeCategorie(categorie) {
    switch (categorie) {
      case 'historique': return <Sword size={14} />
      case 'culturel': return <Landmark size={14} />
      case 'religieux': return <Church size={14} />
      case 'naturel': return <TreePine size={14} />
      default: return <MapPin size={14} />
    }
  }

  const panneauFiltres = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Filtres</h3>
        {nbFiltresActifs > 0 && (
          <button onClick={reinitialiserFiltres} className="text-xs text-blue-600 hover:underline font-medium">
            Tout effacer ({nbFiltresActifs})
          </button>
        )}
      </div>

      {/* Type */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Type d'établissement</p>
        {[['hotel', 'Hôtel'], ['residence', 'Résidence'], ['villa', 'Villa'], ['auberge', 'Auberge']].map(([val, label]) => (
          <label key={val} className="flex items-center gap-2 py-1.5 cursor-pointer group">
            <input type="radio" name="type" value={val}
              checked={filtres.type === val}
              onChange={() => setFiltres(prev => ({ ...prev, type: prev.type === val ? '' : val }))}
              className="text-blue-600 accent-blue-600" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">{label}</span>
          </label>
        ))}
      </div>

      {/* Note minimale */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Note minimale</p>
        {[4.5, 4.0, 3.5, 3.0].map(n => (
          <button key={n} onClick={() => setFiltres(prev => ({ ...prev, etoilesMin: prev.etoilesMin === n ? 0 : n }))}
            className={`flex items-center gap-2 py-1.5 text-sm w-full text-left rounded-lg px-2 transition-colors ${filtres.etoilesMin === n ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <div className="flex">
              {[...Array(Math.floor(n))].map((_, i) => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
            </div>
            <span>{n}+</span>
          </button>
        ))}
      </div>

      {/* Équipements */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Équipements</p>
        {[['wifi', 'WiFi'], ['parking', 'Parking'], ['restaurant', 'Restaurant'], ['piscine', 'Piscine']].map(([val, label]) => (
          <label key={val} className="flex items-center gap-2 py-1.5 cursor-pointer group">
            <input type="checkbox" checked={filtres.equipements.includes(val)}
              onChange={() => toggleEquipement(val)} className="accent-blue-600 rounded" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">{label}</span>
          </label>
        ))}
      </div>

      {/* Prix max */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Prix max / nuit</p>
          {filtres.prixMax > 0 && (
            <span className="text-xs font-bold text-orange-500">{filtres.prixMax.toLocaleString()} FCFA</span>
          )}
        </div>
        <input
          type="range"
          min={0} max={500000} step={5000}
          value={filtres.prixMax || 500000}
          onChange={e => setFiltres(prev => ({ ...prev, prixMax: parseInt(e.target.value) === 500000 ? 0 : parseInt(e.target.value) }))}
          className="w-full accent-orange-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span className={filtres.prixMax === 0 ? 'text-gray-400' : 'text-orange-500 font-medium'}>
            {filtres.prixMax === 0 ? 'Pas de limite' : `≤ ${filtres.prixMax.toLocaleString()} FCFA`}
          </span>
          <span>500 000</span>
        </div>
      </div>

      {/* Nombre de personnes */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Capacité (personnes)</p>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => setFiltres(prev => ({ ...prev, nbPersonnes: prev.nbPersonnes === n ? 0 : n }))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filtres.nbPersonnes === n && n > 0
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              {n === 0 ? 'Tous' : n === 6 ? '6+' : n}
            </button>
          ))}
        </div>
        {filtres.nbPersonnes > 0 && (
          <p className="text-xs text-gray-400 mt-1.5">Chambres pour ≥ {filtres.nbPersonnes} personne{filtres.nbPersonnes > 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Partenaires certifiés */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Abonnement</p>
        <label className="flex items-center gap-2 py-1.5 cursor-pointer">
          <input type="checkbox"
            checked={filtres.restauration}
            onChange={() => setFiltres(prev => ({ ...prev, restauration: !prev.restauration }))}
            className="accent-blue-600 rounded" />
          <span className="text-sm text-gray-600">Partenaires certifiés uniquement</span>
        </label>
      </div>
    </div>
  )

  return (
    <Layout>
      {/* Barre recherche */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-1 items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-2.5 transition-colors">
              <MapPin size={16} className="text-blue-500 shrink-0" />
              <select value={ville} onChange={(e) => setVille(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none font-medium">
                <option value="">Toutes les villes</option>
                {VILLES_BENIN.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 sm:w-40">
              <input type="date" value={dateArrivee} onChange={e => { setDateArrivee(e.target.value); if (dateDepart && e.target.value >= dateDepart) setDateDepart('') }}
                className="bg-transparent text-sm text-gray-700 outline-none w-full" placeholder="Arrivée" />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 sm:w-40">
              <input type="date" value={dateDepart} onChange={e => setDateDepart(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none w-full" placeholder="Départ" />
            </div>
            <button
              onClick={() => {
                const p = new URLSearchParams()
                if (ville) p.set('ville', ville)
                if (dateArrivee) p.set('arrivee', dateArrivee)
                if (dateDepart) p.set('depart', dateDepart)
                p.set('voyageurs', voyageurs)
                setSearchParams(p)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
              <Search size={16} />
              Rechercher
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filtres sidebar desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-36">
              {panneauFiltres}
            </div>
          </aside>

          {/* Résultats */}
          <div className="flex-1 min-w-0">
            {/* En-tête résultats */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <p className="text-gray-800 font-semibold">
                  <span className="text-blue-600">{hotelsFiltres.length}</span> hébergement{hotelsFiltres.length > 1 ? 's' : ''} trouvé{hotelsFiltres.length > 1 ? 's' : ''}
                  {ville && <span className="text-gray-500 font-normal"> à {ville}</span>}
                </p>
                {dateArrivee && dateDepart && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(dateArrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(dateDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {voyageurs} voyageur{voyageurs > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setFiltresOuverts(!filtresOuverts)}
                  className="lg:hidden flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Filter size={15} />
                  Filtres {nbFiltresActifs > 0 && <span className="bg-blue-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">{nbFiltresActifs}</span>}
                </button>
                <select value={tri} onChange={(e) => setTri(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer">
                  <option value="popularite">Popularité</option>
                  <option value="prix_asc">Prix croissant</option>
                  <option value="prix_desc">Prix décroissant</option>
                  <option value="note">Meilleures notes</option>
                </select>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setVueGrille(true)}
                    className={`p-1.5 rounded-md transition-colors ${vueGrille ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}>
                    <Grid3X3 size={16} className="text-gray-600" />
                  </button>
                  <button onClick={() => setVueGrille(false)}
                    className={`p-1.5 rounded-md transition-colors ${!vueGrille ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}>
                    <List size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filtres mobile */}
            {filtresOuverts && (
              <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-5 mb-5">
                {panneauFiltres}
              </div>
            )}

            {/* Points d'intérêt */}
            {pointsInteret.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                  Points d'intérêt à {ville}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pointsInteret.map(pt => (
                    <button
                      key={`${pt.type}-${pt.id}`}
                      onClick={() => setPointActif(
                        pointActif?.id === String(pt.id) && pointActif?.type === pt.type
                          ? null
                          : { id: String(pt.id), type: pt.type }
                      )}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        pointActif?.id === String(pt.id) && pointActif?.type === pt.type
                          ? 'bg-[#0D1B40] text-white border-[#0D1B40]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#F57C2B] hover:text-[#F57C2B]'
                      }`}
                    >
                      {iconeCategorie(pt.categorie)}
                      {pt.nom}
                      {pt.type === 'evenement' && <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Événement</span>}
                      {pointActif?.id === String(pt.id) && pointActif?.type === pt.type && (
                        <X size={12} className="ml-1" />
                      )}
                    </button>
                  ))}
                </div>
                {pointActif && (
                  <p className="text-xs text-[#F57C2B] mt-1.5 flex items-center gap-1">
                    <Navigation size={12} />
                    Hôtels triés par distance à ce point
                    <button onClick={() => setPointActif(null)} className="ml-2 underline text-gray-400 hover:text-gray-600">Réinitialiser</button>
                  </p>
                )}
              </div>
            )}

            {/* Bandeau événement en cours */}
            {evenements.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 mb-5 flex items-start gap-3">
                <div>
                  <p className="font-bold text-orange-700 text-sm">
                    {evenements.map(e => e.nom).join(' · ')}
                  </p>
                  <p className="text-xs text-orange-500 mt-0.5">
                    Événement en cours à {ville} — les hôtels partenaires certifiés sont mis en avant pendant cette période.
                  </p>
                  {evenements[0] && (
                    <p className="text-xs text-orange-400 mt-0.5">
                      Du {new Date(evenements[0].date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au {new Date(evenements[0].date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {chargement ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Loader2 size={40} className="text-blue-500 mx-auto mb-3 animate-spin" />
                <p className="text-gray-500">Recherche en cours...</p>
              </div>
            ) : hotelsFiltres.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Search size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 text-lg mb-2">Aucun hébergement trouvé</h3>
                <p className="text-gray-500 text-sm">Essayez avec une autre ville ou modifiez vos filtres.</p>
                <button onClick={reinitialiserFiltres}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className={vueGrille
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-4'
              }>
                {hotelsFiltres.map(hotel => (
                  <CarteHotel key={hotel.id} hotel={hotel} vue={vueGrille ? 'grille' : 'liste'} estBooste={hotel.est_booste || false} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

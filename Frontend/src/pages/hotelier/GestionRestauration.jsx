import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, X, Save, Utensils, CheckCircle, AlertCircle, Loader, Clock, ChefHat, Truck, ShoppingBag, Upload, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarHotelier from '../../components/common/SidebarHotelier'
import api from '../../services/api'

const resolverUrl = url => {
  if (!url) return ''
  if (url.startsWith('blob:') || url.startsWith('http')) return url
  return `http://localhost:8000${url}`
}

const STATUTS_COMMANDE = [
  { val: 'en_attente',     label: 'En attente',      couleur: 'bg-gray-100 text-gray-600',    icon: Clock },
  { val: 'en_preparation', label: 'En préparation',  couleur: 'bg-amber-100 text-amber-700',  icon: ChefHat },
  { val: 'prete',          label: 'Prête',            couleur: 'bg-green-100 text-green-700',  icon: CheckCircle },
  { val: 'livree',         label: 'Livrée',           couleur: 'bg-blue-100 text-blue-700',    icon: Truck },
  { val: 'annulee',        label: 'Annulée',          couleur: 'bg-red-100 text-red-500',      icon: X },
]

const CATEGORIES = [
  { id: 'entrees', label: 'Entrées' },
  { id: 'plats', label: 'Plats principaux' },
  { id: 'grillades', label: 'Grillades' },
  { id: 'poissons', label: 'Poissons & Fruits de mer' },
  { id: 'vegetarien', label: 'Végétarien' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'boissons', label: 'Boissons' },
  { id: 'petit_dejeuner', label: 'Petit-déjeuner' },
]

const PLAT_VIDE = { nom: '', categorie: 'plats', prix: '', description: '', est_disponible: true }

export default function GestionRestauration() {
  const [hotelId, setHotelId] = useState(null)
  const [hotel, setHotel] = useState(null)
  const [plats, setPlats] = useState([])
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreCategorie, setFiltreCategorie] = useState('tous')
  const [onglet, setOnglet] = useState('menu')
  const [modalOuverte, setModalOuverte] = useState(false)
  const [platEdite, setPlatEdite] = useState(null)
  const [form, setForm] = useState(PLAT_VIDE)
  const [suppression, setSuppression] = useState(null)
  const [message, setMessage] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [photoPlat, setPhotoPlat] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    async function charger() {
      try {
        const res = await api.get('/gestionnaire/hotels/')
        const hotel = res.data[0]
        if (!hotel) return
        setHotel(hotel)
        setHotelId(hotel.id)
        const [resPlats, resCommandes] = await Promise.all([
          api.get(`/gestionnaire/hotels/${hotel.id}/menu/`),
          api.get(`/gestionnaire/hotels/${hotel.id}/commandes/`),
        ])
        setPlats(resPlats.data)
        setCommandes(resCommandes.data)
      } catch (err) {
        console.error('Erreur chargement restauration', err)
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [])

  const setChamp = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const flash = (type, texte) => {
    setMessage({ type, texte })
    setTimeout(() => setMessage(null), 3000)
  }

  const ouvrirAjout = () => { setPlatEdite(null); setForm(PLAT_VIDE); setPhotoPlat(null); setPhotoPreview(null); setModalOuverte(true) }
  const ouvrirEdition = (p) => {
    setPlatEdite(p.id)
    setForm({ nom: p.nom, categorie: p.categorie, prix: p.prix, description: p.description, est_disponible: p.est_disponible })
    setPhotoPlat(null)
    setPhotoPreview(p.photo ? resolverUrl(p.photo) : null)
    setModalOuverte(true)
  }

  const sauvegarder = async () => {
    if (!form.nom || !form.prix) return
    setEnCours(true)
    try {
      let res
      if (photoPlat) {
        // Utiliser FormData si une photo est sélectionnée
        const formData = new FormData()
        formData.append('nom', form.nom)
        formData.append('categorie', form.categorie)
        formData.append('description', form.description)
        formData.append('prix', parseFloat(form.prix))
        formData.append('est_disponible', form.est_disponible)
        formData.append('photo', photoPlat)
        if (platEdite) {
          res = await api.patch(`/gestionnaire/hotels/${hotelId}/menu/${platEdite}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
          res = await api.post(`/gestionnaire/hotels/${hotelId}/menu/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
      } else {
        const payload = { nom: form.nom, categorie: form.categorie, description: form.description, prix: parseFloat(form.prix), est_disponible: form.est_disponible }
        if (platEdite) {
          res = await api.patch(`/gestionnaire/hotels/${hotelId}/menu/${platEdite}/`, payload)
        } else {
          res = await api.post(`/gestionnaire/hotels/${hotelId}/menu/`, payload)
        }
      }
      if (platEdite) {
        setPlats(p => p.map(pl => pl.id === platEdite ? res.data : pl))
        flash('succes', 'Plat modifié avec succès')
      } else {
        setPlats(p => [...p, res.data])
        flash('succes', 'Plat ajouté au menu')
      }
      setModalOuverte(false)
    } catch (err) {
      flash('erreur', err.response?.data ? JSON.stringify(err.response.data) : 'Erreur serveur')
    } finally {
      setEnCours(false)
    }
  }

  const supprimerPlat = async (id) => {
    try {
      await api.delete(`/gestionnaire/hotels/${hotelId}/menu/${id}/`)
      setPlats(p => p.filter(pl => pl.id !== id))
      setSuppression(null)
      flash('succes', 'Plat supprimé du menu')
    } catch { flash('erreur', 'Impossible de supprimer ce plat') }
  }

  const toggleDisponible = async (plat) => {
    try {
      const res = await api.patch(`/gestionnaire/hotels/${hotelId}/menu/${plat.id}/`, { est_disponible: !plat.est_disponible })
      setPlats(p => p.map(pl => pl.id === plat.id ? res.data : pl))
    } catch { flash('erreur', 'Impossible de modifier la disponibilité') }
  }

  const majStatutCommande = async (id, statut) => {
    try {
      const res = await api.patch(`/gestionnaire/commandes/${id}/statut/`, { statut })
      setCommandes(prev => prev.map(c => c.id === id ? res.data : c))
    } catch {
      flash('erreur', 'Impossible de mettre à jour le statut')
    }
  }

  const platsFiltres = filtreCategorie === 'tous' ? plats : plats.filter(p => p.categorie === filtreCategorie)
  const categoriesPresentes = ['tous', ...CATEGORIES.filter(c => plats.some(p => p.categorie === c.id)).map(c => c.id)]

  const commandesActives = commandes.filter(c => !['livree', 'annulee'].includes(c.statut))

  if (chargement) return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 flex items-center justify-center"><Loader size={32} className="animate-spin text-blue-500" /></div>
    </div>
  )

  if (hotel && hotel.type_abonnement !== 'pro') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarHotelier />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Crown size={32} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-3">Fonctionnalité PRO</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Le module Restauration (menu + commandes en chambre) est réservé aux abonnés <strong className="text-amber-700">PRO</strong>.
              Passez en Pro pour offrir à vos clients la possibilité de commander des repas directement depuis leur chambre.
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 mb-6">
              <strong>Abonnement PRO · 5% de commission</strong><br />
              Restauration, badge PRO, priorité dans la recherche
            </div>
            <a href="/hotelier/abonnements"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              <Crown size={16} /> Passer en PRO
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 min-w-0 p-6 lg:p-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restauration</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {plats.length} plat{plats.length > 1 ? 's' : ''} au menu
              {commandesActives.length > 0 && <span className="ml-2 text-orange-500 font-semibold">· {commandesActives.length} commande{commandesActives.length > 1 ? 's' : ''} en cours</span>}
            </p>
          </div>
          {onglet === 'menu' && (
            <button onClick={ouvrirAjout}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              <Plus size={18} /> Ajouter un plat
            </button>
          )}
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm font-medium ${message.type === 'succes' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {message.type === 'succes' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {message.texte}
          </div>
        )}

        {/* Onglets */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: 'menu', label: `Menu (${plats.length})` },
            { id: 'commandes', label: `Commandes reçues${commandes.length ? ` (${commandes.length})` : ''}` },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${onglet === o.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {o.id === 'commandes' && commandesActives.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              )}
              {o.label}
            </button>
          ))}
        </div>

        {/* ---- ONGLET MENU ---- */}
        {onglet === 'menu' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total plats', valeur: plats.length },
                { label: 'Disponibles', valeur: plats.filter(p => p.est_disponible).length },
                { label: 'Catégories', valeur: new Set(plats.map(p => p.categorie)).size },
                { label: 'Prix moyen', valeur: plats.length ? Math.round(plats.reduce((s, p) => s + parseFloat(p.prix), 0) / plats.length).toLocaleString('fr-FR') + ' FCFA' : '–' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-xl font-black text-blue-600">{s.valeur}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filtres catégories */}
            {plats.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {categoriesPresentes.map(cat => {
                  const info = CATEGORIES.find(c => c.id === cat)
                  return (
                    <button key={cat} onClick={() => setFiltreCategorie(cat)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${filtreCategorie === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                      {cat === 'tous' ? 'Tous' : info?.label}
                    </button>
                  )
                })}
              </div>
            )}

            {plats.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Utensils size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucun plat dans le menu. Commencez par ajouter vos premiers plats.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {platsFiltres.map(plat => {
                    const catInfo = CATEGORIES.find(c => c.id === plat.categorie)
                    return (
                      <div key={plat.id} className={`p-5 hover:bg-gray-50 transition-colors ${!plat.est_disponible ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            {plat.photo
                              ? <img src={resolverUrl(plat.photo)} alt={plat.nom} className="w-full h-full object-cover" />
                              : <Utensils size={18} className="text-orange-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-gray-900">{plat.nom}</h3>
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{catInfo?.label || plat.categorie}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plat.est_disponible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                                    {plat.est_disponible ? 'Disponible' : 'Indisponible'}
                                  </span>
                                </div>
                                {plat.description && <p className="text-sm text-gray-400 mt-0.5">{plat.description}</p>}
                              </div>
                              <p className="text-lg font-black text-orange-600 shrink-0">{parseFloat(plat.prix).toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => toggleDisponible(plat)}
                              className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              {plat.est_disponible ? 'Retirer' : 'Remettre'}
                            </button>
                            <button onClick={() => ouvrirEdition(plat)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors"><Edit3 size={15} /></button>
                            <button onClick={() => setSuppression(plat.id)} className="p-2 border border-gray-200 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ---- ONGLET COMMANDES ---- */}
        {onglet === 'commandes' && (
          <div className="space-y-4">
            {commandes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <ShoppingBag size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucune commande reçue pour le moment.</p>
              </div>
            ) : (
              commandes.map(cmd => {
                const statutCfg = STATUTS_COMMANDE.find(s => s.val === cmd.statut) || STATUTS_COMMANDE[0]
                const Icon = statutCfg.icon
                const prochainStatuts = STATUTS_COMMANDE.filter(s => s.val !== cmd.statut && s.val !== 'annulee')
                return (
                  <div key={cmd.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statutCfg.couleur}`}>
                            <Icon size={11} /> {statutCfg.label}
                          </span>
                          {cmd.client_nom && (
                            <span className="text-xs text-gray-400">
                              {cmd.client_nom}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(cmd.date_commande).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="font-black text-orange-600 text-lg shrink-0">
                        {parseFloat(cmd.montant_total).toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span>
                      </p>
                    </div>

                    {/* Lignes de commande */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
                      {cmd.lignes.map((l, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{l.quantite}× {l.nom_plat}</span>
                          <span className="text-gray-500 font-medium">{(parseFloat(l.prix_unitaire) * l.quantite).toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>

                    {cmd.notes && (
                      <p className="text-xs text-gray-400 italic mb-4">"{cmd.notes}"</p>
                    )}

                    {/* Boutons de changement de statut */}
                    {!['livree', 'annulee'].includes(cmd.statut) && (
                      <div className="flex flex-wrap gap-2">
                        {prochainStatuts.map(s => {
                          const BtnIcon = s.icon
                          return (
                            <button key={s.val} onClick={() => majStatutCommande(cmd.id, s.val)}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${s.val === 'en_preparation' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : s.val === 'prete' ? 'border-green-200 text-green-700 hover:bg-green-50' : s.val === 'livree' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                              <BtnIcon size={11} /> {s.label}
                            </button>
                          )
                        })}
                        <button onClick={() => majStatutCommande(cmd.id, 'annulee')}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                          <X size={11} /> Annuler
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Modal ajout / édition */}
        {modalOuverte && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">{platEdite ? 'Modifier le plat' : 'Ajouter un plat'}</h2>
                <button onClick={() => setModalOuverte(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Nom du plat *</label>
                  <input type="text" value={form.nom} onChange={e => setChamp('nom', e.target.value)}
                    placeholder="ex: Poulet braisé au piment..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Catégorie *</label>
                    <select value={form.categorie} onChange={e => setChamp('categorie', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400">
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Prix (FCFA) *</label>
                    <input type="number" value={form.prix} onChange={e => setChamp('prix', e.target.value)}
                      placeholder="2500" min="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => setChamp('description', e.target.value)}
                    rows={2} placeholder="Ingrédients, accompagnements..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-2">Photo du plat</label>
                  <div className="flex items-center gap-3">
                    {photoPreview ? (
                      <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <img src={photoPreview} alt="aperçu" className="w-full h-full object-cover" />
                        <button onClick={() => { setPhotoPlat(null); setPhotoPreview(null) }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                          <X size={10} />
                        </button>
                      </div>
                    ) : null}
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50 text-xs text-gray-400 hover:text-blue-500 transition-colors ${photoPreview ? 'flex-1' : 'w-full'}`}>
                      <Upload size={14} />
                      {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const file = e.target.files[0]
                          if (file) { setPhotoPlat(file); setPhotoPreview(URL.createObjectURL(file)) }
                          e.target.value = ''
                        }} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-2">Disponibilité</label>
                  <div className="flex gap-3">
                    {[{ val: true, label: 'Disponible' }, { val: false, label: 'Indisponible' }].map(s => (
                      <label key={String(s.val)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex-1 ${form.est_disponible === s.val ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <input type="radio" checked={form.est_disponible === s.val} onChange={() => setChamp('est_disponible', s.val)} className="hidden" />
                        <div className={`w-3 h-3 rounded-full ${s.val ? 'bg-green-500' : 'bg-red-400'}`} />
                        <span className="text-sm font-medium text-gray-700">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setModalOuverte(false)} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm">Annuler</button>
                <button onClick={sauvegarder} disabled={!form.nom || !form.prix || enCours}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  {enCours ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  {platEdite ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal suppression */}
        {suppression && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500" /></div>
              <h3 className="font-bold text-gray-900 mb-2">Supprimer ce plat ?</h3>
              <p className="text-sm text-gray-400 mb-5">Il sera retiré définitivement du menu.</p>
              <div className="flex gap-3">
                <button onClick={() => setSuppression(null)} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm">Annuler</button>
                <button onClick={() => supprimerPlat(suppression)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm">Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

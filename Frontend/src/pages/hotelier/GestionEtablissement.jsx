import { useState, useEffect } from 'react'
import { Save, MapPin, Phone, Mail, Globe, Wifi, ParkingSquare, Utensils, Dumbbell, Wind, Waves, Upload, X, CheckCircle, Loader, AlertCircle, Percent, Tag, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarHotelier from '../../components/common/SidebarHotelier'
import { useHotelActif } from '../../context/HotelActifContext'
import api from '../../services/api'

const resolverUrl = url => {
  if (!url) return ''
  if (url.startsWith('blob:') || url.startsWith('http')) return url
  return `http://localhost:8000${url}`
}

const EQUIPEMENTS_LISTE = [
  { id: 'wifi', label: 'WiFi gratuit', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: ParkingSquare },
  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
  { id: 'salle_sport', label: 'Salle de sport', icon: Dumbbell },
  { id: 'climatisation', label: 'Climatisation', icon: Wind },
  { id: 'piscine', label: 'Piscine', icon: Waves },
]

const TYPES_ETABLISSEMENT = [
  { id: 'hotel', label: 'Hôtel' },
  { id: 'residence', label: 'Résidence' },
  { id: 'villa', label: 'Villa' },
  { id: 'auberge', label: 'Auberge' },
]

const VILLES = [
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

export default function GestionEtablissement() {
  const { hotelActif } = useHotelActif()
  const [hotelId, setHotelId] = useState(null)
  const [estPro, setEstPro] = useState(false)
  const [chambres, setChambres] = useState([])
  const [form, setForm] = useState({ nom: '', description: '', ville: '', adresse: '', quartier: '', telephone: '', email: '', site_web: '', type_etablissement: 'hotel', equipements: [], taux_annulation: 20, taux_modification: 10 })
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [onglet, setOnglet] = useState('infos')
  const [photos, setPhotos] = useState([])
  const [promotions, setPromotions] = useState([])
  const [chargementPromos, setChargementPromos] = useState(false)
  const [formPromo, setFormPromo] = useState({ chambreId: '', prixPromo: '', dateDebut: '', dateFin: '', titre: '' })
  const [envoiPromo, setEnvoiPromo] = useState(false)
  // photos : [{ id: number|null, url: string, uploading?: boolean, tempId?: string }]

  useEffect(() => {
    async function charger() {
      if (!hotelActif) return
      try {
        const detail = await api.get(`/gestionnaire/hotels/${hotelActif.id}/`)
        const h = detail.data
        setHotelId(h.id)
        setEstPro(h.type_abonnement === 'pro')
        setChambres(h.types_chambres || [])
        setForm({
          nom: h.nom || '',
          description: h.description || '',
          ville: h.ville || '',
          adresse: h.adresse || '',
          quartier: h.quartier || '',
          telephone: h.telephone || '',
          email: h.email || '',
          site_web: h.site_web || '',
          type_etablissement: h.type_etablissement || 'hotel',
          equipements: h.equipements || [],
          taux_annulation: h.taux_annulation ?? 20,
          taux_modification: h.taux_modification ?? 10,
        })
        // Charger toutes les photos depuis PhotoHotel
        if (h.photos && h.photos.length > 0) {
          setPhotos(h.photos.map(p => ({ id: p.id, url: p.image })))
        } else if (h.photo_principale) {
          // Fallback sur photo_principale si aucune PhotoHotel
          setPhotos([{ id: null, url: h.photo_principale }])
        }
      } catch (err) {
        console.error('Erreur chargement établissement', err)
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [hotelActif?.id])

  const setChamp = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const uploadPhoto = async (file) => {
    const tempId = `temp-${Date.now()}`
    const tempUrl = URL.createObjectURL(file)
    setPhotos(p => [...p, { id: null, url: tempUrl, uploading: true, tempId }])
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post(`/gestionnaire/hotels/${hotelId}/photos/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotos(p => p.map(ph => ph.tempId === tempId
        ? { id: res.data.id, url: res.data.image }
        : ph
      ))
      toast.success('Photo ajoutée !')
    } catch (err) {
      setPhotos(p => p.filter(ph => ph.tempId !== tempId))
      toast.error(err.response?.data?.detail || "Échec de l'upload")
    }
  }

  const supprimerPhoto = async (photo, index) => {
    if (photo.id) {
      try {
        await api.delete(`/gestionnaire/hotels/${hotelId}/photos/${photo.id}/`)
        setPhotos(p => p.filter((_, j) => j !== index))
        toast.success('Photo supprimée')
      } catch {
        toast.error('Impossible de supprimer la photo')
      }
    } else {
      setPhotos(p => p.filter((_, j) => j !== index))
    }
  }

  const sauvegarder = async () => {
    if (!form.nom || !form.ville) return
    setEnCours(true)
    setErreur(null)
    try {
      await api.patch(`/gestionnaire/hotels/${hotelId}/`, {
        nom: form.nom,
        description: form.description,
        ville: form.ville,
        adresse: form.adresse,
        quartier: form.quartier,
        telephone: form.telephone,
        email: form.email,
        site_web: form.site_web,
        type_etablissement: form.type_etablissement,
        equipements: form.equipements,
        taux_annulation: form.taux_annulation,
        taux_modification: form.taux_modification,
      })
      setSauvegarde(true)
      setTimeout(() => setSauvegarde(false), 3000)
    } catch (err) {
      setErreur(err.response?.data ? JSON.stringify(err.response.data) : 'Erreur serveur')
    } finally {
      setEnCours(false)
    }
  }

  const chargerPromos = async () => {
    if (!hotelId) return
    setChargementPromos(true)
    try {
      const res = await api.get(`/gestionnaire/hotels/${hotelId}/promotions/`)
      setPromotions(res.data)
    } catch { /* ignore */ }
    finally { setChargementPromos(false) }
  }

  useEffect(() => {
    if (onglet === 'promotions' && hotelId) chargerPromos()
  }, [onglet, hotelId])

  const creerPromotion = async () => {
    if (!formPromo.chambreId || !formPromo.prixPromo || !formPromo.dateDebut || !formPromo.dateFin) {
      toast.error('Remplissez tous les champs obligatoires')
      return
    }
    setEnvoiPromo(true)
    try {
      await api.post(`/gestionnaire/hotels/${hotelId}/promotions/`, {
        type_chambre: parseInt(formPromo.chambreId),
        prix_promo: parseFloat(formPromo.prixPromo),
        date_debut: formPromo.dateDebut,
        date_fin: formPromo.dateFin,
        titre: formPromo.titre,
      })
      toast.success('Promotion créée !')
      setFormPromo({ chambreId: '', prixPromo: '', dateDebut: '', dateFin: '', titre: '' })
      chargerPromos()
    } catch (err) {
      const msg = err.response?.data
      if (typeof msg === 'object') {
        const first = Object.values(msg)[0]
        toast.error(Array.isArray(first) ? first[0] : String(first))
      } else {
        toast.error('Erreur lors de la création')
      }
    } finally { setEnvoiPromo(false) }
  }

  const supprimerPromotion = async (id) => {
    try {
      await api.delete(`/gestionnaire/hotels/${hotelId}/promotions/${id}/`)
      setPromotions(p => p.filter(pr => pr.id !== id))
      toast.success('Promotion supprimée')
    } catch { toast.error('Erreur lors de la suppression') }
  }

  if (chargement) return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 flex items-center justify-center"><Loader size={32} className="animate-spin text-blue-500" /></div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 min-w-0 p-6 lg:p-8">
        <div className="max-w-3xl">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon établissement</h1>
              <p className="text-gray-400 text-sm mt-0.5">Gérez les informations de votre hôtel</p>
            </div>
            <button onClick={sauvegarder} disabled={enCours}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${sauvegarde ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200'}`}>
              {enCours ? <Loader size={16} className="animate-spin" /> : sauvegarde ? <CheckCircle size={16} /> : <Save size={16} />}
              {sauvegarde ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
          </div>

          {erreur && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {erreur}
            </div>
          )}

          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
            {[
              { id: 'infos', label: 'Informations' },
              { id: 'photos', label: 'Photos' },
              ...(estPro ? [{ id: 'promotions', label: '🏷 Promotions' }] : []),
            ].map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${onglet === o.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {o.label}
              </button>
            ))}
          </div>

          {onglet === 'infos' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-5">Identité de l'établissement</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Nom de l'établissement *</label>
                    <input type="text" value={form.nom} onChange={e => setChamp('nom', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Description</label>
                    <textarea value={form.description} onChange={e => setChamp('description', e.target.value)}
                      rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none" />
                    <p className="text-xs text-gray-300 text-right mt-1">{form.description.length}/500</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> Localisation</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1.5">Ville *</label>
                      <select value={form.ville} onChange={e => setChamp('ville', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400">
                        <option value="">-- Sélectionner --</option>
                        {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1.5">Quartier</label>
                      <input type="text" value={form.quartier} onChange={e => setChamp('quartier', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Adresse complète</label>
                    <input type="text" value={form.adresse} onChange={e => setChamp('adresse', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-5">Type d'établissement</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TYPES_ETABLISSEMENT.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => setChamp('type_etablissement', t.id)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${form.type_etablissement === t.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-5">Équipements de l'établissement</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {EQUIPEMENTS_LISTE.map(eq => {
                    const actif = form.equipements.includes(eq.id)
                    return (
                      <button key={eq.id} type="button"
                        onClick={() => setChamp('equipements', actif
                          ? form.equipements.filter(e => e !== eq.id)
                          : [...form.equipements, eq.id]
                        )}
                        className={`flex items-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${actif ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <eq.icon size={16} />
                        {eq.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-amber-100 bg-amber-50 p-6">
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Percent size={16} className="text-amber-500" /> Politique d'annulation
                </h2>
                <p className="text-xs text-amber-700 mb-5">Ces taux sont appliqués automatiquement par la plateforme lors d'une annulation ou modification.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1.5">% frais d'annulation *</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" value={form.taux_annulation}
                        onChange={e => setChamp('taux_annulation', Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full border border-gray-200 rounded-xl px-4 pr-8 py-3 text-sm outline-none focus:border-amber-400" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1.5">% frais de modification *</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" value={form.taux_modification}
                        onChange={e => setChamp('taux_modification', Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full border border-gray-200 rounded-xl px-4 pr-8 py-3 text-sm outline-none focus:border-amber-400" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-3 bg-amber-100 rounded-lg px-3 py-2">
                  La plateforme offre 2h après le paiement pour annuler/modifier gratuitement. Au-delà : {form.taux_annulation}% retenus sur annulation, {form.taux_modification}% sur modification à la baisse.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-5">Contacts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { champ: 'telephone', label: 'Téléphone', icon: Phone, placeholder: '01XXXXXXXX', type: 'tel' },
                    { champ: 'email', label: 'Email', icon: Mail, placeholder: 'contact@hotel.bj', type: 'email' },
                    { champ: 'site_web', label: 'Site web', icon: Globe, placeholder: 'https://hotel.bj', type: 'text' },
                  ].map(c => (
                    <div key={c.champ}>
                      <label className="text-xs text-gray-500 font-medium block mb-1.5">{c.label}</label>
                      <div className="relative">
                        <c.icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={c.type} value={form[c.champ]}
                          onChange={e => setChamp(c.champ, c.champ === 'telephone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value)}
                          placeholder={c.placeholder}
                          maxLength={c.champ === 'telephone' ? 10 : undefined}
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {onglet === 'photos' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-2">Photos de l'établissement</h2>
              <p className="text-xs text-gray-400 mb-1">
                {estPro
                  ? `Abonnement Pro — jusqu'à 15 photos. (${photos.length}/15)`
                  : `Abonnement standard — jusqu'à 5 photos. (${photos.length}/5)`}
              </p>
              {!estPro && <p className="text-xs text-blue-500 mb-5">Passez en Pro pour ajouter jusqu'à 15 photos.</p>}
              {estPro && <p className="text-xs text-gray-400 mb-5">La première sera utilisée comme photo principale.</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo, i) => (
                  <div key={photo.tempId || photo.id || i} className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
                    <img src={resolverUrl(photo.url)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Principale</span>}
                    {photo.uploading ? (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader size={20} className="animate-spin text-white" />
                      </div>
                    ) : (
                      <button onClick={() => supprimerPhoto(photo, i)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {photos.length < (estPro ? 15 : 5) && (
                  <label className="aspect-video border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                    <Upload size={24} className="text-gray-300 group-hover:text-blue-400 mb-2" />
                    <p className="text-xs text-gray-400 group-hover:text-blue-500 text-center">Ajouter une photo</p>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files[0]
                        if (file) uploadPhoto(file)
                        e.target.value = ''
                      }} />
                  </label>
                )}
              </div>
              {photos.length === 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  Aucune photo ajoutée. Un établissement avec des photos attire 3× plus de réservations.
                </div>
              )}
            </div>
          )}

          {onglet === 'promotions' && (
            <div className="space-y-5">
              {/* Formulaire création */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Plus size={16} className="text-red-500" /> Créer une promotion
                </h2>
                <p className="text-xs text-gray-400 mb-5">Définissez un prix réduit pour une chambre sur une période donnée. La plateforme la mettra en avant automatiquement.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1.5">Chambre *</label>
                      <select value={formPromo.chambreId} onChange={e => setFormPromo(p => ({ ...p, chambreId: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400">
                        <option value="">-- Choisir une chambre --</option>
                        {chambres.map(c => (
                          <option key={c.id} value={c.id}>{c.nom} — {Math.round(c.prix_nuit).toLocaleString('fr-FR')} FCFA/nuit</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1.5">Prix promotionnel (FCFA) *</label>
                      <input type="number" min="0" value={formPromo.prixPromo}
                        onChange={e => setFormPromo(p => ({ ...p, prixPromo: e.target.value }))}
                        placeholder="Ex: 25000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400" />
                      {formPromo.chambreId && formPromo.prixPromo && (
                        <p className="text-xs mt-1 text-red-500 font-medium">
                          Réduction : {Math.round((1 - parseFloat(formPromo.prixPromo) / parseFloat(chambres.find(c => String(c.id) === formPromo.chambreId)?.prix_nuit || 1)) * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1.5">Date de début *</label>
                      <input type="date" value={formPromo.dateDebut}
                        onChange={e => setFormPromo(p => ({ ...p, dateDebut: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1.5">Date de fin *</label>
                      <input type="date" value={formPromo.dateFin}
                        onChange={e => setFormPromo(p => ({ ...p, dateFin: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Titre (optionnel)</label>
                    <input type="text" value={formPromo.titre}
                      onChange={e => setFormPromo(p => ({ ...p, titre: e.target.value }))}
                      placeholder="Ex: Offre Fête Nationale, Promo Weekend..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400" />
                  </div>
                  <button onClick={creerPromotion} disabled={envoiPromo}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:bg-gray-200">
                    {envoiPromo ? <Loader size={15} className="animate-spin" /> : <Tag size={15} />}
                    Créer la promotion
                  </button>
                </div>
              </div>

              {/* Liste des promotions */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-5">Promotions existantes</h2>
                {chargementPromos ? (
                  <div className="flex justify-center py-8"><Loader size={24} className="animate-spin text-gray-400" /></div>
                ) : promotions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Aucune promotion créée pour le moment.</p>
                ) : (
                  <div className="space-y-3">
                    {promotions.map(pr => (
                      <div key={pr.id} className={`flex items-center justify-between p-4 rounded-xl border ${pr.est_en_cours ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            {pr.est_en_cours && <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">En cours</span>}
                            <p className="text-sm font-semibold text-gray-800">{pr.chambre_nom}</p>
                            {pr.titre && <span className="text-xs text-gray-500">— {pr.titre}</span>}
                          </div>
                          <p className="text-xs text-gray-500">
                            <span className="line-through text-gray-400">{Math.round(pr.prix_original).toLocaleString('fr-FR')} FCFA</span>
                            {' → '}
                            <span className="text-red-600 font-bold">{Math.round(pr.prix_promo).toLocaleString('fr-FR')} FCFA</span>
                            {' · '}
                            {new Date(pr.date_debut).toLocaleDateString('fr-FR')} au {new Date(pr.date_fin).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <button onClick={() => supprimerPromotion(pr.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {onglet !== 'promotions' && (
            <div className="flex justify-end mt-6">
              <button onClick={sauvegarder} disabled={enCours}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${sauvegarde ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200'}`}>
                {enCours ? <Loader size={16} className="animate-spin" /> : sauvegarde ? <CheckCircle size={16} /> : <Save size={16} />}
                {sauvegarde ? 'Sauvegardé !' : 'Sauvegarder les modifications'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, X, Save, BedDouble, Users, Wifi, Wind, Tv, CheckCircle, AlertCircle, Loader, Lock, Droplets, Sun, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarHotelier from '../../components/common/SidebarHotelier'
import api from '../../services/api'

const resolverUrl = url => {
  if (!url) return ''
  if (url.startsWith('blob:') || url.startsWith('http')) return url
  return `http://localhost:8000${url}`
}

const EQUIPEMENTS_CHAMBRE = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'clim', label: 'Climatisation', icon: Wind },
  { id: 'tv', label: 'Télévision', icon: Tv },
  { id: 'sdb_privee', label: 'Salle de bain privée', icon: Droplets },
  { id: 'balcon', label: 'Balcon', icon: Sun },
  { id: 'coffre', label: 'Coffre-fort', icon: Lock },
]

const CHAMBRE_VIDE = { nom: '', description: '', prix_nuit: '', capacite: 2, nombre_chambres: 1, equipements: [], est_disponible: true }

export default function GestionChambres() {
  const [hotelId, setHotelId] = useState(null)
  const [chambres, setChambres] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalOuverte, setModalOuverte] = useState(false)
  const [chambreEditee, setChambreEditee] = useState(null)
  const [form, setForm] = useState(CHAMBRE_VIDE)
  const [suppression, setSuppression] = useState(null)
  const [message, setMessage] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [photosModal, setPhotosModal] = useState([])
  // photosModal : [{ id, url, uploading?, tempId? }]

  useEffect(() => {
    async function charger() {
      try {
        const res = await api.get('/gestionnaire/hotels/')
        const hotel = res.data[0]
        if (!hotel) return
        setHotelId(hotel.id)
        const resC = await api.get(`/gestionnaire/hotels/${hotel.id}/chambres/`)
        setChambres(resC.data)
      } catch (err) {
        console.error('Erreur chargement chambres', err)
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [])

  const setChamp = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleEquip = (id) => setForm(p => ({
    ...p,
    equipements: p.equipements.includes(id) ? p.equipements.filter(e => e !== id) : [...p.equipements, id]
  }))

  const flash = (type, texte) => {
    setMessage({ type, texte })
    setTimeout(() => setMessage(null), 3000)
  }

  const ouvrirAjout = () => { setChambreEditee(null); setForm(CHAMBRE_VIDE); setPhotosModal([]); setModalOuverte(true) }
  const ouvrirEdition = (c) => {
    setChambreEditee(c.id)
    setForm({ nom: c.nom, description: c.description, prix_nuit: c.prix_nuit, capacite: c.capacite, nombre_chambres: c.nombre_chambres, equipements: c.equipements || [], est_disponible: c.est_disponible })
    setPhotosModal((c.photos || []).map(p => ({ id: p.id, url: p.image })))
    setModalOuverte(true)
  }

  const uploadPhotoChambre = async (file) => {
    if (chambreEditee) {
      const tempId = `temp-${Date.now()}`
      const tempUrl = URL.createObjectURL(file)
      setPhotosModal(p => [...p, { id: null, url: tempUrl, uploading: true, tempId }])
      try {
        const formData = new FormData()
        formData.append('image', file)
        const res = await api.post(`/gestionnaire/hotels/${hotelId}/chambres/${chambreEditee}/photos/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        setPhotosModal(p => p.map(ph => ph.tempId === tempId ? { id: res.data.id, url: res.data.image } : ph))
        setChambres(prev => prev.map(c => c.id === chambreEditee
          ? { ...c, photos: [...(c.photos || []), res.data] }
          : c
        ))
        toast.success('Photo ajoutée !')
      } catch {
        setPhotosModal(p => p.filter(ph => ph.tempId !== tempId))
        toast.error("Échec de l'upload")
      }
    } else {
      // Mode ajout : stocker localement, upload après création de la chambre
      const tempUrl = URL.createObjectURL(file)
      setPhotosModal(p => [...p, { id: null, url: tempUrl, file }])
    }
  }

  const supprimerPhotoChambre = async (photo, index) => {
    if (photo.id && chambreEditee) {
      try {
        await api.delete(`/gestionnaire/hotels/${hotelId}/chambres/${chambreEditee}/photos/${photo.id}/`)
        setPhotosModal(p => p.filter((_, j) => j !== index))
        setChambres(prev => prev.map(c => c.id === chambreEditee
          ? { ...c, photos: (c.photos || []).filter(ph => ph.id !== photo.id) }
          : c
        ))
        toast.success('Photo supprimée')
      } catch {
        toast.error('Impossible de supprimer')
      }
    } else {
      setPhotosModal(p => p.filter((_, j) => j !== index))
    }
  }

  const sauvegarder = async () => {
    if (!form.nom || !form.prix_nuit) return
    setEnCours(true)
    const payload = { nom: form.nom, description: form.description, prix_nuit: parseFloat(form.prix_nuit), capacite: Number(form.capacite), nombre_chambres: Number(form.nombre_chambres), equipements: form.equipements, est_disponible: form.est_disponible }
    try {
      if (chambreEditee) {
        await api.patch(`/gestionnaire/hotels/${hotelId}/chambres/${chambreEditee}/`, payload)
        const photosActuelles = photosModal.filter(p => p.id).map(p => ({ id: p.id, image: p.url }))
        setChambres(p => p.map(c => c.id === chambreEditee
          ? { ...c, ...payload, photos: photosActuelles }
          : c
        ))
        flash('succes', 'Chambre modifiée avec succès')
      } else {
        const res = await api.post(`/gestionnaire/hotels/${hotelId}/chambres/`, payload)
        const nouvelleChambre = res.data
        const photosUploadees = []
        for (const photo of photosModal.filter(p => p.file)) {
          try {
            const fd = new FormData()
            fd.append('image', photo.file)
            const rp = await api.post(`/gestionnaire/hotels/${hotelId}/chambres/${nouvelleChambre.id}/photos/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            photosUploadees.push(rp.data)
          } catch (err) {
            console.error('Échec upload photo chambre:', err?.response?.data || err)
            toast.error("Une photo n'a pas pu être uploadée")
          }
        }
        setChambres(p => [...p, { ...nouvelleChambre, photos: photosUploadees }])
        flash('succes', 'Chambre ajoutée avec succès')
      }
      setModalOuverte(false)
    } catch (err) {
      flash('erreur', err.response?.data ? JSON.stringify(err.response.data) : 'Erreur serveur')
    } finally {
      setEnCours(false)
    }
  }

  const supprimerChambre = async (id) => {
    try {
      await api.delete(`/gestionnaire/hotels/${hotelId}/chambres/${id}/`)
      setChambres(p => p.filter(c => c.id !== id))
      setSuppression(null)
      flash('succes', 'Chambre supprimée')
    } catch { flash('erreur', 'Impossible de supprimer cette chambre') }
  }

  const toggleStatut = async (chambre) => {
    try {
      const res = await api.patch(`/gestionnaire/hotels/${hotelId}/chambres/${chambre.id}/`, { est_disponible: !chambre.est_disponible })
      setChambres(p => p.map(c => c.id === chambre.id ? res.data : c))
    } catch { flash('erreur', 'Impossible de modifier le statut') }
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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des chambres</h1>
            <p className="text-gray-400 text-sm mt-0.5">{chambres.length} type{chambres.length > 1 ? 's' : ''} · {chambres.reduce((s, c) => s + c.nombre_chambres, 0)} chambres au total</p>
          </div>
          <button onClick={ouvrirAjout} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            <Plus size={18} /> Ajouter une chambre
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm font-medium ${message.type === 'succes' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {message.type === 'succes' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {message.texte}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total chambres', valeur: chambres.reduce((s, c) => s + c.nombre_chambres, 0) },
            { label: 'Types actifs', valeur: chambres.filter(c => c.est_disponible).length },
            { label: 'Prix moyen', valeur: chambres.length ? Math.round(chambres.reduce((s, c) => s + parseFloat(c.prix_nuit), 0) / chambres.length).toLocaleString('fr-FR') + ' FCFA' : '–' },
            { label: 'Capacité max', valeur: chambres.length ? Math.max(...chambres.map(c => c.capacite)) + ' pers.' : '–' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-xl font-black text-blue-600">{s.valeur}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {chambres.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <BedDouble size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune chambre configurée. Ajoutez votre premier type de chambre.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {chambres.map(chambre => (
                <div key={chambre.id} className={`p-5 hover:bg-gray-50 transition-colors ${!chambre.est_disponible ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {chambre.photos?.[0]
                        ? <img src={resolverUrl(chambre.photos[0].image)} alt={chambre.nom} className="w-full h-full object-cover" />
                        : <BedDouble size={22} className="text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{chambre.nom}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chambre.est_disponible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {chambre.est_disponible ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-0.5">{chambre.description}</p>
                        </div>
                        <p className="text-lg font-black text-blue-600 shrink-0">{parseFloat(chambre.prix_nuit).toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA/nuit</span></p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500"><Users size={12} /> {chambre.capacite} pers. max</span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500"><BedDouble size={12} /> {chambre.nombre_chambres} chambre{chambre.nombre_chambres > 1 ? 's' : ''}</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {(chambre.equipements || []).slice(0, 4).map(eq => {
                            const f = EQUIPEMENTS_CHAMBRE.find(e => e.id === eq)
                            return f ? <span key={eq} className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{f.label}</span> : null
                          })}
                          {(chambre.equipements || []).length > 4 && <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full">+{chambre.equipements.length - 4}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleStatut(chambre)} className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        {chambre.est_disponible ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => ouvrirEdition(chambre)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors"><Edit3 size={15} /></button>
                      <button onClick={() => setSuppression(chambre.id)} className="p-2 border border-gray-200 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {modalOuverte && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">{chambreEditee ? 'Modifier la chambre' : 'Ajouter une chambre'}</h2>
                <button onClick={() => setModalOuverte(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Type de chambre *</label>
                  <input type="text" value={form.nom} onChange={e => setChamp('nom', e.target.value)} placeholder="ex: Chambre Standard, Suite Deluxe..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => setChamp('description', e.target.value)} rows={2} placeholder="Décrivez la chambre..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Prix/nuit (FCFA) *</label>
                    <input type="number" value={form.prix_nuit} onChange={e => setChamp('prix_nuit', e.target.value)} placeholder="25000" min="0" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Capacité</label>
                    <select value={form.capacite} onChange={e => setChamp('capacite', Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400">
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} pers.</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">Quantité</label>
                    <input type="number" value={form.nombre_chambres} onChange={e => setChamp('nombre_chambres', Number(e.target.value))} min="1" max="50" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-2">Équipements inclus</label>
                  <div className="grid grid-cols-2 gap-2">
                    {EQUIPEMENTS_CHAMBRE.map(eq => {
                      const actif = form.equipements.includes(eq.id)
                      return (
                        <button key={eq.id} type="button" onClick={() => toggleEquip(eq.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${actif ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                          <eq.icon size={14} className={actif ? 'text-blue-500' : 'text-gray-400'} />
                          {eq.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-2">Statut</label>
                  <div className="flex gap-3">
                    {[{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }].map(s => (
                      <label key={String(s.val)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex-1 ${form.est_disponible === s.val ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <input type="radio" name="statut_chambre" checked={form.est_disponible === s.val} onChange={() => setChamp('est_disponible', s.val)} className="hidden" />
                        <div className={`w-3 h-3 rounded-full ${s.val ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium text-gray-700">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 font-medium block mb-2">
                      Photos de la chambre ({photosModal.length}/5)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {photosModal.map((photo, i) => (
                        <div key={photo.tempId || photo.id || i} className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
                          <img src={resolverUrl(photo.url)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          {photo.uploading ? (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader size={16} className="animate-spin text-white" />
                            </div>
                          ) : (
                            <button onClick={() => supprimerPhotoChambre(photo, i)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                      {photosModal.length < 5 && (
                        <label className="aspect-video border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                          <Upload size={16} className="text-gray-300 group-hover:text-blue-400 mb-1" />
                          <p className="text-xs text-gray-400 group-hover:text-blue-500">Ajouter</p>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => {
                              const file = e.target.files[0]
                              if (file) uploadPhotoChambre(file)
                              e.target.value = ''
                            }} />
                        </label>
                      )}
                    </div>
                  </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setModalOuverte(false)} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm">Annuler</button>
                <button onClick={sauvegarder} disabled={!form.nom || !form.prix_nuit || enCours}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  {enCours ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  {chambreEditee ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {suppression && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500" /></div>
              <h3 className="font-bold text-gray-900 mb-2">Supprimer cette chambre ?</h3>
              <p className="text-sm text-gray-400 mb-5">Cette action est irréversible. Les réservations existantes ne seront pas affectées.</p>
              <div className="flex gap-3">
                <button onClick={() => setSuppression(null)} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm">Annuler</button>
                <button onClick={() => supprimerChambre(suppression)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm">Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

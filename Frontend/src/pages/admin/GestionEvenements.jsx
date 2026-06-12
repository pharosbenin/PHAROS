import { useState, useEffect } from 'react'
import usePolling from '../../hooks/usePolling'
import { CalendarDays, Plus, Edit2, Trash2, MapPin, Clock, Star, X, Save, Calendar, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'


const FORM_VIDE = {
  nom: '', region: '', date_debut: '', date_fin: '',
  est_actif: true, description: '', villes_concernees: [], categorie: 'culturel',
}

export default function GestionEvenements() {
  const [evenements, setEvenements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(FORM_VIDE)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [confirmerSuppression, setConfirmerSuppression] = useState(null)
  const [suppression, setSuppression] = useState(false)
  const [villesDisponibles, setVillesDisponibles] = useState([])
  const [villeLibre, setVilleLibre] = useState('')

  const charger = () => {
    setChargement(true)
    api.get('/admin/evenements/')
      .then(res => setEvenements(res.data || []))
      .catch(() => toast.error('Erreur lors du chargement des événements'))
      .finally(() => setChargement(false))
  }

  usePolling(charger, 30000)
  useEffect(() => {
    api.get('/hotels/villes/').then(res => setVillesDisponibles(res.data || [])).catch(() => {})
  }, [])

  const ouvrir = (evt = null) => {
    if (evt) {
      setForm({
        id: evt.id,
        nom: evt.nom || '',
        region: evt.region || '',
        date_debut: evt.date_debut || '',
        date_fin: evt.date_fin || '',
        est_actif: evt.est_actif ?? true,
        description: evt.description || '',
        villes_concernees: evt.villes_concernees || [],
        categorie: evt.categorie || 'culturel',
      })
    } else {
      setForm({ ...FORM_VIDE })
    }
    setModal(evt || 'nouveau')
  }

  const fermer = () => { setModal(null); setForm(FORM_VIDE) }

  const toggleVille = (ville) => {
    setForm(prev => ({
      ...prev,
      villes_concernees: prev.villes_concernees.includes(ville)
        ? prev.villes_concernees.filter(v => v !== ville)
        : [...prev.villes_concernees, ville],
    }))
  }

  const sauvegarder = async () => {
    setSauvegarde(true)
    const payload = {
      nom: form.nom,
      region: form.region,
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      est_actif: form.est_actif,
      description: form.description,
      villes_concernees: form.villes_concernees,
      categorie: form.categorie,
    }
    try {
      if (modal === 'nouveau') {
        await api.post('/admin/evenements/', payload)
        toast.success('Événement créé !')
      } else {
        await api.patch(`/admin/evenements/${form.id}/`, payload)
        toast.success('Événement mis à jour !')
      }
      fermer()
      charger()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde')
    } finally {
      setSauvegarde(false)
    }
  }

  const supprimer = async (id) => {
    setSuppression(true)
    try {
      await api.delete(`/admin/evenements/${id}/`)
      toast.success('Événement supprimé.')
      setConfirmerSuppression(null)
      charger()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setSuppression(false)
    }
  }

  const toggleActif = async (evt) => {
    try {
      await api.patch(`/admin/evenements/${evt.id}/`, { est_actif: !evt.est_actif })
      charger()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const actifs = evenements.filter(e => e.est_actif)
  const inactifs = evenements.filter(e => !e.est_actif)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />

      <div className="flex-1 min-w-0 p-6 lg:p-8">

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Événements nationaux</h1>
            <p className="text-gray-400 text-sm mt-0.5">Planifiez les mises en avant automatiques lors des événements</p>
          </div>
          <button
            onClick={() => ouvrir()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Nouvel événement
          </button>
        </div>

        {/* Info algo */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <Star size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-0.5">Mise en avant automatique</p>
            <p className="text-xs text-blue-600">
              Les hôtels <strong>PRO</strong> situés dans les villes concernées apparaissent en tête des résultats pendant l'événement.
            </p>
          </div>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Événements actifs */}
            <div className="mb-8">
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Événements actifs ({actifs.length})
              </h2>
              {actifs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                  Aucun événement actif
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {actifs.map(e => (
                    <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                            <Calendar size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{e.nom}</p>
                            {e.region && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin size={11} /> {e.region}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => ouvrir(e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setConfirmerSuppression(e.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {e.description && <p className="text-xs text-gray-500 mb-3">{e.description}</p>}

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Clock size={11} />
                          {new Date(e.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {e.date_debut !== e.date_fin && ` → ${new Date(e.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                        </span>
                        {e.est_en_cours && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">En cours</span>}
                        {e.est_a_venir && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">À venir</span>}
                      </div>

                      {(e.villes_concernees || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {e.villes_concernees.map(v => (
                            <span key={v} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{v}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Événements inactifs */}
            {inactifs.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                  Inactifs / Archivés ({inactifs.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {inactifs.map(e => (
                    <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-5 opacity-60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                            <Calendar size={18} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-700">{e.nom}</p>
                            {e.region && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={11} />{e.region}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleActif(e)} className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                            Réactiver
                          </button>
                          <button onClick={() => setConfirmerSuppression(e.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal formulaire */}
        {modal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">{modal === 'nouveau' ? 'Nouvel événement' : "Modifier l'événement"}</h3>
                <button onClick={fermer} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nom de l'événement *</label>
                  <input type="text" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Ex: Fête du Vodun"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Région / Lieu principal</label>
                  <input type="text" value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                    placeholder="Ex: Ouidah"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Date de début *</label>
                    <input type="date" value={form.date_debut} onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Date de fin *</label>
                    <input type="date" value={form.date_fin} onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Décrivez cet événement..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">
                    Villes concernées (hôtels PRO mis en avant)
                  </label>

                  {/* Champ libre pour toute ville béninoise */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={villeLibre}
                      onChange={e => setVilleLibre(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && villeLibre.trim()) {
                          e.preventDefault()
                          const v = villeLibre.trim()
                          if (!form.villes_concernees.includes(v)) toggleVille(v)
                          setVilleLibre('')
                        }
                      }}
                      placeholder="Saisir une ville (ex: Nikki, Kétou…) et appuyer Entrée"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = villeLibre.trim()
                        if (v && !form.villes_concernees.includes(v)) toggleVille(v)
                        setVilleLibre('')
                      }}
                      className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>

                  {/* Villes existantes issues des hôtels */}
                  {villesDisponibles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {villesDisponibles.map(v => (
                        <button key={v} type="button" onClick={() => toggleVille(v)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${form.villes_concernees.includes(v) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Villes sélectionnées */}
                  {form.villes_concernees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.villes_concernees.map(v => (
                        <span key={v} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-medium">
                          {v}
                          <button type="button" onClick={() => toggleVille(v)} className="hover:text-blue-200">×</button>
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.est_actif} onChange={e => setForm(p => ({ ...p, est_actif: e.target.checked }))}
                    className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-gray-700">Événement actif</span>
                </label>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button onClick={fermer} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                <button onClick={sauvegarder}
                  disabled={!form.nom || !form.date_debut || !form.date_fin || sauvegarde}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {sauvegarde ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal suppression */}
        {confirmerSuppression && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Supprimer cet événement ?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmerSuppression(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button onClick={() => supprimer(confirmerSuppression)} disabled={suppression}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">
                  {suppression ? <Loader size={14} className="animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

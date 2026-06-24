import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Loader, X, Wallet } from 'lucide-react'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'

const STATUTS = {
  en_attente: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  approuve:   { label: 'Approuvé',   cls: 'bg-green-100 text-green-700' },
  rejete:     { label: 'Rejeté',     cls: 'bg-red-100 text-red-600' },
}

const formatDate = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function GestionRetraitsAdmin() {
  const [retraits, setRetraits] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('en_attente')
  const [notif, setNotif] = useState({ msg: '', type: 'success' })
  const [enCours, setEnCours] = useState(null)
  const [modalRejet, setModalRejet] = useState(null)
  const [motifRejet, setMotifRejet] = useState('')
  const [erreurRejet, setErreurRejet] = useState('')

  const charger = async (statut = filtreStatut) => {
    setChargement(true)
    try {
      const res = await api.get(`/admin/retraits/?statut=${statut}`)
      setRetraits(res.data.retraits || [])
    } catch (err) {
      console.error(err)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger(filtreStatut) }, [filtreStatut])

  const afficherNotif = (msg, type = 'success') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif({ msg: '', type: 'success' }), 4000)
  }

  const approuver = async (retrait) => {
    setEnCours(retrait.id)
    try {
      const res = await api.post(`/admin/retraits/${retrait.id}/approuver/`)
      afficherNotif(res.data.message)
      charger(filtreStatut)
    } catch (err) {
      afficherNotif(err.response?.data?.detail || 'Erreur lors de l\'approbation.', 'error')
    } finally {
      setEnCours(null)
    }
  }

  const soumettreRejet = async () => {
    setErreurRejet('')
    if (!motifRejet.trim()) { setErreurRejet('Le motif est requis.'); return }
    setEnCours(modalRejet.id)
    try {
      await api.post(`/admin/retraits/${modalRejet.id}/rejeter/`, { motif: motifRejet.trim() })
      afficherNotif('Demande de retrait rejetée.')
      setModalRejet(null)
      setMotifRejet('')
      charger(filtreStatut)
    } catch (err) {
      setErreurRejet(err.response?.data?.detail || 'Erreur.')
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <SidebarAdmin />
      <div className="flex-1 min-w-0 p-6 lg:p-8">

        {notif.msg && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
            {notif.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} {notif.msg}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Demandes de retrait</h1>
          <p className="text-gray-400 text-sm mt-0.5">Approuvez ou rejetez les demandes de retrait des hôteliers</p>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {[
            { val: 'en_attente', label: 'En attente' },
            { val: 'approuve', label: 'Approuvés' },
            { val: 'rejete', label: 'Rejetés' },
            { val: 'tous', label: 'Tous' },
          ].map(f => (
            <button key={f.val} onClick={() => setFiltreStatut(f.val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${filtreStatut === f.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {chargement ? (
          <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-blue-500" /></div>
        ) : retraits.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center">
            <Wallet size={36} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">Aucune demande de retrait</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3">Hôtel</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Gestionnaire</th>
                    <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Montant</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Méthode</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Numéro</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Date</th>
                    <th className="text-center text-xs font-semibold text-gray-400 px-5 py-3">Statut / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {retraits.map(r => {
                    const s = STATUTS[r.statut] ?? STATUTS.en_attente
                    return (
                      <tr key={r.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-white">{r.hotel_nom}</p>
                          <p className="text-xs text-gray-400">{r.hotel_ville}</p>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-300">{r.gestionnaire_nom}</td>
                        <td className="px-3 py-4 text-right font-bold text-white">
                          {parseFloat(r.montant).toLocaleString('fr-FR')}
                          <span className="text-xs font-normal text-gray-400 ml-1">FCFA</span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-300">{r.methode_display}</td>
                        <td className="px-3 py-4 text-sm font-mono text-gray-300">
                          {r.methode === 'carte'
                            ? `**** **** **** ${r.numero_telephone.slice(-4)}`
                            : r.numero_telephone}
                        </td>
                        <td className="px-3 py-4 text-xs text-gray-400">{formatDate(r.date_demande)}</td>
                        <td className="px-5 py-4 text-center">
                          {r.statut === 'en_attente' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => approuver(r)} disabled={enCours === r.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors">
                                {enCours === r.id ? <Loader size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                                Approuver
                              </button>
                              <button onClick={() => { setModalRejet(r); setMotifRejet(''); setErreurRejet('') }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                                <XCircle size={11} /> Rejeter
                              </button>
                            </div>
                          ) : (
                            <div>
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>
                                {s.label}
                              </span>
                              {r.statut === 'rejete' && r.motif_rejet && (
                                <p className="text-xs text-red-400 mt-1 max-w-[160px] mx-auto">{r.motif_rejet}</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal rejet */}
      {modalRejet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Rejeter la demande</h2>
              <button onClick={() => setModalRejet(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="font-semibold text-gray-800">{modalRejet.hotel_nom}</p>
                <p className="text-gray-500">{parseFloat(modalRejet.montant).toLocaleString('fr-FR')} FCFA — {modalRejet.methode_display}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold block mb-1.5">Motif du rejet *</label>
                <textarea value={motifRejet} onChange={e => setMotifRejet(e.target.value)} rows={3}
                  placeholder="Expliquez la raison du rejet..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 resize-none" />
              </div>
              {erreurRejet && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{erreurRejet}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setModalRejet(null)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
                <button onClick={soumettreRejet} disabled={enCours === modalRejet.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                  {enCours === modalRejet.id ? <Loader size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

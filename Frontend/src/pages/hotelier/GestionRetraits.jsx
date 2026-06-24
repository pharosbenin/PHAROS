import { useState, useEffect } from 'react'
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle, Loader, ArrowDownToLine, X } from 'lucide-react'
import SidebarHotelier from '../../components/common/SidebarHotelier'
import { useHotelActif } from '../../context/HotelActifContext'
import api from '../../services/api'

const STATUTS = {
  en_attente: { label: 'En attente', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  approuve:   { label: 'Approuvé',   cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejete:     { label: 'Rejeté',     cls: 'bg-red-100 text-red-600',     icon: XCircle },
}

const formatDate = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const METHODES_RETRAIT = [
  { val: 'mtn',   label: 'MTN Mobile Money' },
  { val: 'moov',  label: 'Moov Money' },
  { val: 'carte', label: 'Carte bancaire' },
]

function ModalRetrait({ solde, hotelId, onFermer, onSuccess }) {
  const [montant, setMontant] = useState(String(Math.floor(solde)))
  const [methode, setMethode] = useState('mtn')
  const [numero, setNumero] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const isCarte = methode === 'carte'

  const handleMethodeChange = (val) => {
    setMethode(val)
    setNumero('')
    setErreur('')
  }

  const handleNumeroChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '')
    setNumero(digits.slice(0, isCarte ? 16 : 10))
  }

  const handleSubmit = async () => {
    setErreur('')
    const m = parseFloat(montant)
    if (!m || m <= 0) { setErreur('Montant invalide.'); return }
    if (m > solde) { setErreur(`Montant supérieur au solde disponible (${Math.floor(solde).toLocaleString('fr-FR')} FCFA).`); return }

    if (isCarte) {
      if (!/^\d{16}$/.test(numero)) {
        setErreur('Numéro de carte bancaire invalide (16 chiffres).')
        return
      }
    } else {
      if (numero.length !== 10 || !numero.startsWith('0')) {
        setErreur('Numéro Mobile Money invalide (10 chiffres, commençant par 0).')
        return
      }
    }

    setEnvoi(true)
    try {
      const res = await api.post('/gestionnaire/retraits/', {
        montant: m,
        methode,
        numero_telephone: numero,
        hotel_id: hotelId,
      })
      onSuccess(res.data.message)
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Une erreur est survenue.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Demande de retrait</h2>
          <button onClick={onFermer} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-purple-700 font-medium">Solde disponible</span>
            <span className="text-lg font-black text-purple-700">{Math.floor(solde).toLocaleString('fr-FR')} FCFA</span>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1.5">Montant à retirer (FCFA)</label>
            <input
              type="number" value={montant} onChange={e => setMontant(e.target.value)}
              min="1" max={solde} step="1"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400"
            />
            {parseFloat(montant) > solde && (
              <p className="text-xs text-red-500 mt-1">Le montant dépasse votre solde disponible.</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1.5">Méthode de retrait</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODES_RETRAIT.map(m => (
                <button key={m.val} onClick={() => handleMethodeChange(m.val)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${methode === m.val ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1.5">
              {isCarte ? 'Numéro de carte bancaire *' : 'Numéro Mobile Money *'}
            </label>
            <input
              type="tel" value={numero}
              onChange={handleNumeroChange}
              placeholder={isCarte ? '1234567890123456' : '0XXXXXXXXX'}
              maxLength={isCarte ? 16 : 10}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 font-mono tracking-wider"
            />
            <p className="text-xs text-gray-400 mt-1">
              {isCarte ? `${numero.length}/16 chiffres` : `${numero.length}/10 chiffres`}
            </p>
          </div>

          {erreur && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{erreur}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onFermer} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={envoi}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              {envoi ? <Loader size={14} className="animate-spin" /> : <ArrowDownToLine size={14} />}
              Soumettre
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GestionRetraits() {
  const { hotelActif } = useHotelActif()
  const [data, setData] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [modal, setModal] = useState(false)
  const [notif, setNotif] = useState('')

  const charger = async () => {
    if (!hotelActif) return
    try {
      const res = await api.get(`/gestionnaire/retraits/?hotel_id=${hotelActif.id}`)
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { if (hotelActif) charger() }, [hotelActif?.id])

  const handleSuccess = (msg) => {
    setModal(false)
    setNotif(msg)
    charger()
    setTimeout(() => setNotif(''), 5000)
  }

  const solde = data?.solde_disponible ?? 0
  const aDemandeEnCours = data?.en_attente_count > 0

  if (chargement) return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 flex items-center justify-center"><Loader size={32} className="animate-spin text-purple-500" /></div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 min-w-0 p-6 lg:p-8">

        {notif && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm">
            <CheckCircle size={16} /> {notif}
          </div>
        )}

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Retraits</h1>
            <p className="text-gray-400 text-sm mt-0.5">Retirez vos fonds libérés vers votre compte Mobile Money</p>
          </div>
        </div>

        {/* Solde */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
              <Wallet size={28} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Solde disponible</p>
              <p className="text-3xl font-black text-purple-700 mt-0.5">{Math.floor(solde).toLocaleString('fr-FR')} <span className="text-lg font-normal text-gray-400">FCFA</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Fonds libérés après confirmation des séjours — retraits approuvés déduits</p>
            </div>
          </div>
          <button
            onClick={() => setModal(true)}
            disabled={solde <= 0 || aDemandeEnCours}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shrink-0 transition-colors"
          >
            <ArrowDownToLine size={16} />
            Retirer les fonds
          </button>
        </div>

        {aDemandeEnCours && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">Une demande de retrait est en cours de traitement. Vous pourrez en soumettre une nouvelle après son traitement.</p>
          </div>
        )}

        {solde <= 0 && !aDemandeEnCours && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={18} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500">Aucun solde disponible pour le moment. Les fonds sont libérés lorsque les deux parties confirment la fin d'un séjour.</p>
          </div>
        )}

        {/* Historique */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Historique des retraits</h2>
          </div>
          {!data?.retraits?.length ? (
            <div className="p-10 text-center text-gray-400">
              <Wallet size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">Aucun retrait effectué pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3">Date</th>
                    <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Montant</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Méthode</th>
                    <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Numéro</th>
                    <th className="text-center text-xs font-semibold text-gray-400 px-5 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.retraits.map(r => {
                    const s = STATUTS[r.statut] ?? STATUTS.en_attente
                    const Icon = s.icon
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-xs text-gray-500">{formatDate(r.date_demande)}</td>
                        <td className="px-3 py-4 text-right font-bold text-gray-800">{parseFloat(r.montant).toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span></td>
                        <td className="px-3 py-4 text-sm text-gray-600">{r.methode_display}</td>
                        <td className="px-3 py-4 text-sm font-mono text-gray-600">
                          {r.methode === 'carte'
                            ? `**** **** **** ${r.numero_telephone.slice(-4)}`
                            : r.numero_telephone}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div>
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>
                              <Icon size={10} /> {s.label}
                            </span>
                            {r.statut === 'rejete' && r.motif_rejet && (
                              <p className="text-xs text-red-500 mt-1 max-w-[180px] mx-auto">{r.motif_rejet}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ModalRetrait
          solde={solde}
          hotelId={hotelActif?.id}
          onFermer={() => setModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

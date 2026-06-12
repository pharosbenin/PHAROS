import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Check, Loader2, Lock, Info, Shield, Zap } from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'

const METHODES = [
  {
    id: 'mtn',
    label: 'MTN Mobile Money',
    couleur: 'bg-yellow-400',
    textColor: 'text-yellow-900',
    logo: 'MTN',
    testNum: '61234567',
    iconBg: 'bg-yellow-50 border-yellow-200',
    selectedBg: 'border-yellow-500 bg-yellow-50',
  },
  {
    id: 'moov',
    label: 'Moov Money',
    couleur: 'bg-blue-600',
    textColor: 'text-white',
    logo: 'MOOV',
    testNum: '96543210',
    iconBg: 'bg-blue-50 border-blue-200',
    selectedBg: 'border-blue-500 bg-blue-50',
  },
]

export default function Paiement() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [methode, setMethode] = useState('mtn')
  const [telephone, setTelephone] = useState('')
  const [etape, setEtape] = useState('saisie') // saisie | attente | succes
  const [erreur, setErreur] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [secondes, setSecondes] = useState(4)
  const timerRef = useRef(null)

  const reservationNumero = state?.reservationNumero
  const reservationData = state || {
    panier: [{ type: 'Chambre Standard', quantite: 1, prix: 25000 }],
    dateArrivee: '2026-06-10',
    dateDepart: '2026-06-12',
    nuits: 2,
    total: 50000,
    commissionTaux: 3,
    hotelNom: 'Hôtel du Lac',
    clientInfo: { nom: 'Dupont', prenom: 'Jean', email: 'jean@email.com' },
  }

  const total = reservationData.total || 50000
  const taux = reservationData.commissionTaux || 3
  const commission = Math.round(total * taux / 100)
  const escrow = total - commission
  const methodeActive = METHODES.find(m => m.id === methode)

  // Compte à rebours sur l'écran d'attente
  useEffect(() => {
    if (etape === 'attente') {
      setSecondes(4)
      timerRef.current = setInterval(() => {
        setSecondes(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [etape])

  const validerPaiement = async (e) => {
    e.preventDefault()
    if (!telephone || telephone.length < 8) {
      setErreur('Veuillez saisir un numéro valide (8 chiffres)')
      return
    }
    if (!reservationNumero) {
      setErreur('Numéro de réservation manquant. Recommencez la réservation.')
      return
    }

    setErreur('')
    setEtape('attente')

    try {
      const [res] = await Promise.all([
        api.post(`/reservations/${reservationNumero}/paiement/`, {
          methode,
          numero_telephone: `+229${telephone}`,
        }),
        new Promise(resolve => setTimeout(resolve, 4000)),
      ])
      setTransactionId(res.data.transaction_id || 'FDP-' + Math.random().toString(36).substring(2, 10).toUpperCase())
      setEtape('succes')
      setTimeout(() => {
        navigate(`/confirmation/${reservationNumero}`, {
          state: {
            reservation: res.data.reservation,
            methodeLabel: methodeActive?.label,
            transactionId: res.data.transaction_id,
          }
        })
      }, 2000)
    } catch (err) {
      setEtape('saisie')
      const data = err.response?.data
      const msg = data?.detail || data?.non_field_errors?.[0]
        || (data ? JSON.stringify(data) : null)
        || err.message
        || 'Erreur lors du paiement. Veuillez réessayer.'
      setErreur(msg)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">

        {etape === 'saisie' && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
            <ChevronLeft size={18} /> Retour
          </button>
        )}

        {/* En-tête FedaPay simulation */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5 shadow-sm">
          <div className="bg-[#1A1A2E] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF6B2B] rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wide">FedaPay</p>
                <p className="text-gray-400 text-xs">Paiement sécurisé</p>
              </div>
            </div>
          </div>

          {/* Montant */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 mb-0.5">{reservationData.hotelNom || 'PHAROS Bénin'}</p>
            <p className="text-2xl font-black text-gray-900">{total.toLocaleString()} <span className="text-base font-semibold text-gray-500">FCFA</span></p>
          </div>

          {etape === 'saisie' && (
            <div className="p-5">
              <form onSubmit={validerPaiement}>

                {/* Opérateur */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Opérateur</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {METHODES.map(m => (
                    <button key={m.id} type="button" onClick={() => setMethode(m.id)}
                      className={`p-3.5 rounded-xl border-2 transition-all text-left ${methode === m.id ? m.selectedBg : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <div className={`w-9 h-9 ${m.couleur} rounded-lg flex items-center justify-center mb-2`}>
                        <span className={`text-xs font-black ${m.textColor}`}>{m.logo}</span>
                      </div>
                      <p className="font-semibold text-sm text-gray-800 leading-tight">{m.label}</p>
                      {methode === m.id && (
                        <div className="flex items-center gap-1 mt-1">
                          <Check size={11} className="text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">Sélectionné</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Téléphone */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Numéro de téléphone</p>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#FF6B2B] transition-colors mb-2">
                  <span className="text-gray-500 text-sm font-semibold">+229</span>
                  <div className="w-px h-5 bg-gray-200" />
                  <input type="tel" value={telephone}
                    onChange={e => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="XXXXXXXX" className="flex-1 text-sm text-gray-800 outline-none" required />
                </div>

{erreur && <p className="text-red-500 text-xs mt-2 mb-1">{erreur}</p>}

                <p className="text-xs text-gray-400 mb-5">
                  Vous recevrez une confirmation {methodeActive?.label} pour valider le paiement.
                </p>

                <button type="submit"
                  className="w-full bg-[#FF6B2B] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Payer {total.toLocaleString()} FCFA
                </button>
              </form>
            </div>
          )}

          {etape === 'attente' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className={`w-16 h-16 ${methodeActive?.couleur} rounded-full flex items-center justify-center`}>
                  <span className={`text-lg font-black ${methodeActive?.textColor}`}>{methodeActive?.logo}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-gray-100">
                  <Loader2 size={14} className="text-[#FF6B2B] animate-spin" />
                </div>
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Confirmation en cours...</h2>
              <p className="text-gray-500 text-sm mb-4">
                Vérifiez votre téléphone <strong>+229 {telephone}</strong>
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">En attente de validation {methodeActive?.label}</p>
                <p className="text-xs text-amber-600">Montant : <strong>{total.toLocaleString()} FCFA</strong></p>
                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" />
                  Traitement{secondes > 0 ? ` (${secondes}s)` : '...'}
                </p>
              </div>
            </div>
          )}

          {etape === 'succes' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Paiement confirmé !</h2>
              <p className="text-gray-500 text-sm mb-3">Redirection vers votre confirmation...</p>
              {transactionId && (
                <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                  {transactionId}
                </p>
              )}
            </div>
          )}

          {/* Footer FedaPay */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
            <Shield size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">Sécurisé par <strong className="text-gray-500">FedaPay</strong></span>
          </div>
        </div>

        {/* Récapitulatif escrow */}
        {etape === 'saisie' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Répartition des fonds</h2>
            <div className="space-y-2 text-sm">
              {(reservationData.panier || []).map((item, i) => (
                <div key={i} className="flex justify-between text-gray-500 text-xs">
                  <span>{item.type} × {item.quantite || 1} ({reservationData.nuits} nuit{reservationData.nuits > 1 ? 's' : ''})</span>
                  <span>{((item.prix || 25000) * (item.quantite || 1) * reservationData.nuits).toLocaleString()} FCFA</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Commission PHAROS ({taux}%)
                  </span>
                  <span className="font-medium text-gray-700">{commission.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    Escrow pour l'hôtel
                  </span>
                  <span className="font-medium text-gray-700">{escrow.toLocaleString()} FCFA</span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 mt-2">
                <p className="text-xs text-blue-600 flex items-start gap-1.5">
                  <Info size={11} className="mt-0.5 shrink-0" />
                  Les {escrow.toLocaleString()} FCFA sont libérés vers l'hôtel uniquement après confirmation des deux parties.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

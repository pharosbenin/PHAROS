import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Check, Loader2, Info, Shield, Zap } from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'
import logoMtn from '../../assets/paiements/mtn.svg'
import logoMoov from '../../assets/paiements/moov.png'
import logoCeltiis from '../../assets/paiements/celtiis.svg'
import logoVisa from '../../assets/paiements/visa.svg'
import logoMastercard from '../../assets/paiements/mastercard.svg'

const METHODES = [
  {
    id: 'mtn',
    label: 'MTN Mobile Money',
    logos: [logoMtn],
    selectedBg: 'border-yellow-500 bg-yellow-50',
    type: 'mobile',
  },
  {
    id: 'moov',
    label: 'Moov Money',
    logos: [logoMoov],
    selectedBg: 'border-blue-500 bg-blue-50',
    type: 'mobile',
  },
  {
    id: 'celtiis',
    label: 'Celtiis Money',
    logos: [logoCeltiis],
    selectedBg: 'border-green-500 bg-green-50',
    type: 'mobile',
  },
  {
    id: 'carte',
    label: 'Carte bancaire',
    logos: [logoVisa, logoMastercard],
    selectedBg: 'border-gray-500 bg-gray-50',
    type: 'carte',
  },
]

export default function Paiement() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [methode, setMethode] = useState('mtn')
  const [etape, setEtape] = useState('saisie') // saisie | redirection
  const [erreur, setErreur] = useState('')

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

  const validerPaiement = async (e) => {
    e.preventDefault()
    if (!reservationNumero) {
      setErreur('Numéro de réservation manquant. Recommencez la réservation.')
      return
    }

    setErreur('')
    setEtape('redirection')

    try {
      const res = await api.post(`/reservations/${reservationNumero}/paiement/`, { methode })
      // Redirection réelle vers la page de paiement hébergée FedaPay (sandbox)
      window.location.href = res.data.payment_url
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
      <div className="min-h-screen bg-orange-100/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {etape === 'saisie' && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-orange-600 hover:bg-blue-600 text-white font-semibold text-sm mb-6 px-4 py-2 rounded-xl transition-colors shadow-sm">
            <ChevronLeft size={18} /> Retour
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr] gap-6 items-start">

        {/* En-tête FedaPay simulation */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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

                {/* Méthode de paiement */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mode de paiement</p>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {METHODES.map(m => (
                    <button key={m.id} type="button" onClick={() => { setMethode(m.id); setErreur('') }}
                      className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-left flex flex-row items-center gap-2.5 shadow-md hover:shadow-xl hover:-translate-y-1 transform ${methode === m.id ? m.selectedBg + ' scale-[1.03]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className="w-9 h-9 bg-white border border-gray-200 rounded-md flex items-center justify-center shrink-0 gap-0.5 p-1">
                        {m.logos.map((src, i) => (
                          <img key={i} src={src} alt="" className="max-w-full max-h-full object-contain" />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-800 leading-tight truncate">{m.label}</p>
                        {methode === m.id && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Check size={10} className="text-blue-600" />
                            <span className="text-[10px] text-blue-600 font-semibold">Sélectionné</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mb-5">
                  Vous serez redirigé vers la page de paiement sécurisée FedaPay pour choisir votre opérateur ({methodeActive?.label}) et confirmer.
                </p>

{erreur && <p className="text-red-500 text-xs mt-2 mb-1">{erreur}</p>}

                <button type="submit"
                  className="w-full bg-[#FF6B2B] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Continuer vers FedaPay — {total.toLocaleString()} FCFA
                </button>
              </form>
            </div>
          )}

          {etape === 'redirection' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center gap-1 p-2.5">
                  {methodeActive?.logos.map((src, i) => (
                    <img key={i} src={src} alt="" className="max-w-full max-h-full object-contain" />
                  ))}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-gray-100">
                  <Loader2 size={14} className="text-[#FF6B2B] animate-spin" />
                </div>
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Redirection vers FedaPay...</h2>
              <p className="text-gray-500 text-sm">Vous allez arriver sur la page de paiement sécurisée.</p>
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
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
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

        </div>{/* fin grid */}

      </div>
      </div>
    </Layout>
  )
}

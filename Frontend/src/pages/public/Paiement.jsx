import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Smartphone, Check, Loader2, Lock, Info } from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'

const METHODES = [
  { id: 'mtn', label: 'MTN Mobile Money', couleur: 'bg-yellow-400', logo: 'MTN', prefixe: '06' },
  { id: 'moov', label: 'Moov Money', couleur: 'bg-blue-500', logo: 'MOOV', prefixe: '09' },
]

export default function Paiement() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [methode, setMethode] = useState('mtn')
  const [telephone, setTelephone] = useState('')
  const [etape, setEtape] = useState('saisie') // saisie | attente | succes
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
      const res = await api.post(`/reservations/${reservationNumero}/paiement/`, {
        methode: methode,
        numero_telephone: `+229${telephone}`,
      })
      setEtape('succes')
      setTimeout(() => {
        navigate(`/confirmation/${reservationNumero}`, {
          state: {
            reservation: res.data.reservation,
            methodeLabel: methode === 'mtn' ? 'MTN Mobile Money' : 'Moov Money',
          }
        })
      }, 1500)
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ChevronLeft size={18} /> Retour à la réservation
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Paiement sécurisé</h1>
        <p className="text-gray-500 text-sm mb-6">Vos fonds sont protégés par le système Escrow PHAROS jusqu'à la fin de votre séjour.</p>

        {/* Récapitulatif financier */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif financier</h2>
          <div className="space-y-2 text-sm">
            {reservationData.panier.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{item.type} × {item.quantite} ({reservationData.nuits} nuit{reservationData.nuits > 1 ? 's' : ''})</span>
                <span>{((item.prix || 25000) * item.quantite * reservationData.nuits).toLocaleString()} FCFA</span>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-2 space-y-2">
              <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Total à payer</span>
                <span className="text-blue-600">{total.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Décomposition escrow */}
            <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Répartition des fonds</p>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  Commission PHAROS ({taux}%)
                </span>
                <span className="font-semibold text-gray-700">{commission.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  Mis en Escrow pour l'hôtel
                </span>
                <span className="font-semibold text-gray-700">{escrow.toLocaleString()} FCFA</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-400 flex items-start gap-1.5">
                  <Info size={11} className="mt-0.5 shrink-0 text-blue-400" />
                  Les {escrow.toLocaleString()} FCFA sont conservés par PHAROS et transférés à l'hôtel uniquement après votre séjour.
                </p>
              </div>
            </div>
          </div>
        </div>

        {etape === 'saisie' && (
          <form onSubmit={validerPaiement}>
            {/* Choix méthode */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
              <h2 className="font-semibold text-gray-900 mb-4">Méthode de paiement</h2>
              <div className="grid grid-cols-2 gap-3">
                {METHODES.map(m => (
                  <button key={m.id} type="button" onClick={() => setMethode(m.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${methode === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-10 h-10 ${m.couleur} rounded-lg flex items-center justify-center text-xl mb-2`}>{m.logo}</div>
                    <p className="font-medium text-sm text-gray-800">{m.label}</p>
                    {methode === m.id && (
                      <div className="flex items-center gap-1 mt-1">
                        <Check size={12} className="text-blue-600" />
                        <span className="text-xs text-blue-600">Sélectionné</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Numéro Mobile Money */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
              <h2 className="font-semibold text-gray-900 mb-4">Numéro Mobile Money</h2>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors">
                <span className="text-gray-500 text-sm font-medium">+229</span>
                <div className="w-px h-5 bg-gray-200" />
                <input type="tel" value={telephone}
                  onChange={e => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="XXXXXXXX" className="flex-1 text-sm text-gray-800 outline-none" required />
              </div>
              {erreur && <p className="text-red-500 text-xs mt-1">{erreur}</p>}
              <p className="text-xs text-gray-400 mt-2">
                Vous recevrez une notification pour confirmer le paiement de <strong>{total.toLocaleString()} FCFA</strong>.
              </p>
            </div>

            {/* Notice escrow */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <Lock size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Comment fonctionne l'Escrow PHAROS ?</p>
                <ul className="text-xs text-blue-600 mt-1 space-y-1 list-disc list-inside">
                  <li>Vous payez {total.toLocaleString()} FCFA aujourd'hui</li>
                  <li>PHAROS conserve {escrow.toLocaleString()} FCFA jusqu'à la fin de votre séjour</li>
                  <li>Après le séjour, vous et l'hôtel confirmez sur la plateforme</li>
                  <li>Les fonds sont alors transférés à l'hôtel</li>
                  <li>En cas de problème, vous êtes remboursé</li>
                </ul>
              </div>
            </div>

            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg">
              <Smartphone size={22} />
              Payer {total.toLocaleString()} FCFA
            </button>
          </form>
        )}

        {etape === 'attente' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Traitement en cours...</h2>
            <p className="text-gray-500 text-sm">Vérifiez votre téléphone et confirmez le paiement {methode === 'mtn' ? 'MTN Mobile Money' : 'Moov Money'}.</p>
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-yellow-800">En attente de confirmation</p>
              <p className="text-xs text-yellow-600 mt-1">Numéro : +229 {telephone}</p>
              <p className="text-xs text-yellow-600">Montant : {total.toLocaleString()} FCFA</p>
            </div>
          </div>
        )}

        {etape === 'succes' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Paiement confirmé !</h2>
            <p className="text-gray-500 text-sm">Redirection vers votre confirmation...</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

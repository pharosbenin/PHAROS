import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, X, Zap } from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'

const METHODE_LABELS = {
  mtn: 'MTN Mobile Money',
  moov: 'Moov Money',
  celtiis: 'Celtiis Money',
  carte: 'Carte bancaire',
}

const INTERVALLE_MS = 2000
const TENTATIVES_MAX = 20 // ~40s

export default function PaiementRetour() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reservationNumero = searchParams.get('reservation')
  const ferme = searchParams.get('close') === 'true'
  const [statut, setStatut] = useState(() => reservationNumero ? 'verification' : 'erreur') // verification | echoue | annule | timeout | erreur
  const tentatives = useRef(0)

  useEffect(() => {
    if (!reservationNumero) return

    let annule = false

    const verifier = async () => {
      try {
        const res = await api.get(`/reservations/${reservationNumero}/paiement/statut/`)
        if (annule) return

        if (res.data.statut === 'reussi') {
          navigate(`/confirmation/${reservationNumero}`, {
            state: {
              reservation: res.data.reservation,
              methodeLabel: METHODE_LABELS[res.data.reservation?.paiement?.methode] || 'FedaPay',
              transactionId: res.data.transaction_id,
            },
            replace: true,
          })
          return
        }

        if (res.data.statut === 'echoue') {
          setStatut('echoue')
          return
        }

        // FedaPay laisse la transaction "en attente" même après une annulation manuelle.
        // S'il a signalé la fermeture de sa page dans l'URL de retour, inutile de continuer à sonder.
        if (ferme) {
          setStatut('annule')
          return
        }

        tentatives.current += 1
        if (tentatives.current >= TENTATIVES_MAX) {
          setStatut('timeout')
          return
        }
        setTimeout(verifier, INTERVALLE_MS)
      } catch {
        if (!annule) setStatut('erreur')
      }
    }

    verifier()
    return () => { annule = true }
  }, [reservationNumero, navigate, ferme])

  return (
    <Layout>
      <div className="min-h-screen bg-orange-100/70 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md w-full overflow-hidden">
          <div className="bg-[#1A1A2E] px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF6B2B] rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">FedaPay</p>
              <p className="text-gray-400 text-xs">Paiement sécurisé</p>
            </div>
          </div>

          <div className="p-8 text-center">
            {statut === 'verification' && (
              <>
                <Loader2 size={40} className="text-[#FF6B2B] animate-spin mx-auto mb-4" />
                <h2 className="text-base font-bold text-gray-900 mb-1">Vérification du paiement...</h2>
                <p className="text-gray-500 text-sm">Merci de patienter, cela peut prendre quelques secondes.</p>
              </>
            )}

            {statut === 'echoue' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} className="text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Paiement refusé ou annulé</h2>
                <p className="text-gray-500 text-sm mb-5">La transaction n'a pas abouti. Vous pouvez réessayer.</p>
                <button
                  onClick={() => navigate('/paiement', { state: { reservationNumero } })}
                  className="w-full bg-[#FF6B2B] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Réessayer le paiement
                </button>
              </>
            )}

            {statut === 'annule' && (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} className="text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Paiement annulé</h2>
                <p className="text-gray-500 text-sm mb-5">Vous avez annulé le paiement sur FedaPay. Aucun montant n'a été débité.</p>
                <button
                  onClick={() => navigate('/paiement', { state: { reservationNumero } })}
                  className="w-full bg-[#FF6B2B] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Réessayer le paiement
                </button>
              </>
            )}

            {statut === 'timeout' && (
              <>
                <Loader2 size={40} className="text-amber-500 mx-auto mb-4" />
                <h2 className="text-base font-bold text-gray-900 mb-1">Toujours en attente</h2>
                <p className="text-gray-500 text-sm mb-5">La confirmation prend plus de temps que prévu.</p>
                <button
                  onClick={() => { tentatives.current = 0; setStatut('verification') }}
                  className="w-full bg-[#FF6B2B] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Vérifier à nouveau
                </button>
              </>
            )}

            {statut === 'erreur' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} className="text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Impossible de vérifier le paiement</h2>
                <p className="text-gray-500 text-sm">Référence de réservation manquante ou erreur réseau.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

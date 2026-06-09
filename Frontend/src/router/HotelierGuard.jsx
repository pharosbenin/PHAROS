import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, XCircle, ShieldOff, Loader } from 'lucide-react'
import api from '../services/api'

const MESSAGES = {
  en_attente: {
    icon: Clock,
    couleur: 'amber',
    titre: 'En attente de validation',
    texte: "Votre établissement a bien été enregistré. Notre équipe va examiner votre dossier et vous notifier dès que votre hôtel sera validé. Ce processus prend généralement 24 à 48h.",
  },
  rejete: {
    icon: XCircle,
    couleur: 'red',
    titre: 'Demande rejetée',
    texte: "Votre demande d'enregistrement a été rejetée par notre équipe. Veuillez contacter le support PHAROS pour en connaître la raison et soumettre un nouveau dossier.",
  },
  suspendu: {
    icon: ShieldOff,
    couleur: 'orange',
    titre: 'Établissement suspendu',
    texte: "Votre établissement a été temporairement suspendu. Contactez l'équipe PHAROS pour régulariser votre situation.",
  },
}

const COULEURS = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', titre: 'text-amber-900', texte: 'text-amber-700' },
  red:   { bg: 'bg-red-50',   border: 'border-red-200',   icon: 'text-red-500',   titre: 'text-red-900',   texte: 'text-red-700'   },
  orange:{ bg: 'bg-orange-50',border: 'border-orange-200',icon: 'text-orange-500',titre: 'text-orange-900',texte: 'text-orange-700'},
}

export default function HotelierGuard({ children }) {
  const [statut, setStatut] = useState(null)
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/gestionnaire/hotels/')
      .then(res => {
        const hotels = res.data || []
        // Préférer un hôtel validé s'il en existe un
        const hotel = hotels.find(h => h.statut === 'valide') || hotels[0]
        setStatut(hotel?.statut ?? 'en_attente')
      })
      .catch(() => setStatut('en_attente'))
      .finally(() => setChargement(false))
  }, [])

  if (chargement) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader size={36} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (statut !== 'valide') {
    const cfg = MESSAGES[statut] || MESSAGES.en_attente
    const cl = COULEURS[cfg.couleur]
    const Icon = cfg.icon

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className={`max-w-md w-full ${cl.bg} border ${cl.border} rounded-2xl p-8 text-center shadow-sm`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-white shadow-sm`}>
            <Icon size={32} className={cl.icon} />
          </div>
          <h1 className={`text-xl font-black mb-3 ${cl.titre}`}>{cfg.titre}</h1>
          <p className={`text-sm leading-relaxed mb-6 ${cl.texte}`}>{cfg.texte}</p>
          <div className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-block mb-6 bg-white ${cl.icon} border ${cl.border}`}>
            Statut : {statut === 'en_attente' ? 'En attente' : statut === 'rejete' ? 'Rejeté' : 'Suspendu'}
          </div>
          <br />
          <button
            onClick={() => navigate('/connexion')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  return children
}

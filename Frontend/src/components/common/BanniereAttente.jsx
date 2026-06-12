import { Clock } from 'lucide-react'

export default function BanniereAttente({ hotel }) {
  if (!hotel || hotel.statut !== 'en_attente') return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <Clock size={16} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">
            Votre établissement est en attente de validation
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            L'équipe PHAROS examine votre dossier (24 à 48h). Votre profil sera visible dès validation.
          </p>
        </div>
        <span className="shrink-0 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
          En attente
        </span>
      </div>
    </div>
  )
}

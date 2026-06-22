import { Link } from 'react-router-dom'
import { Shield, Users, Hotel, CreditCard, QrCode, AlertTriangle, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import Layout from '../../components/common/Layout'

const SECTIONS = [
  {
    id: 'clients',
    icon: Users,
    couleur: 'text-blue-600',
    fond: 'bg-blue-50',
    bordure: 'border-blue-200',
    titre: 'Règles pour les voyageurs',
    regles: [
      { ok: true,  texte: 'Fournir des informations exactes lors de l\'inscription et de la réservation.' },
      { ok: true,  texte: 'Respecter les horaires de check-in et check-out communiqués par l\'établissement.' },
      { ok: true,  texte: 'Utiliser le QR Code de réservation uniquement pour votre propre séjour.' },
      { ok: true,  texte: 'Signaler tout problème rencontré via la plateforme dans les 24 h suivant l\'arrivée.' },
      { ok: false, texte: 'Il est interdit de céder, revendre ou partager votre confirmation de réservation.' },
      { ok: false, texte: 'Toute tentative de fraude entraîne la suspension définitive du compte.' },
      { ok: false, texte: 'Les réservations multiples sur le même créneau sans annulation préalable sont interdites.' },
    ],
  },
  {
    id: 'hoteliers',
    icon: Hotel,
    couleur: 'text-[#F57C2B]',
    fond: 'bg-orange-50',
    bordure: 'border-orange-200',
    titre: 'Règles pour les hôteliers',
    regles: [
      { ok: true,  texte: 'Renseigner des informations exactes sur l\'établissement (photos, équipements, prix).' },
      { ok: true,  texte: 'Maintenir à jour la disponibilité des chambres pour éviter les sur-réservations.' },
      { ok: true,  texte: 'Honorer toute réservation confirmée via PHAROS, sauf cas de force majeure.' },
      { ok: true,  texte: 'Appliquer les tarifs affichés sur la plateforme sans surcharge à l\'arrivée.' },
      { ok: false, texte: 'Il est interdit de refuser un client confirmé pour le rediriger hors de la plateforme.' },
      { ok: false, texte: 'Les fausses disponibilités ou faux avis entraînent la suspension immédiate.' },
      { ok: false, texte: 'La collecte de données clients en dehors de PHAROS est strictement interdite.' },
    ],
  },
  {
    id: 'paiement',
    icon: CreditCard,
    couleur: 'text-green-600',
    fond: 'bg-green-50',
    bordure: 'border-green-200',
    titre: 'Paiement & Règlement',
    regles: [
      { ok: true,  texte: 'Les paiements s\'effectuent uniquement via les canaux officiels PHAROS (MTN Money, Moov Money, Celtiis Money, Carte bancaire).' },
      { ok: true,  texte: 'Votre paiement est sécurisé et conservé en escrow jusqu\'à confirmation mutuelle du séjour.' },
      { ok: true,  texte: 'Un reçu numérique et un QR Code de confirmation sont disponibles dans votre espace client après paiement.' },
      { ok: true,  texte: 'Annulation dans les 2 h suivant le paiement : remboursement intégral. Au-delà, des frais selon la politique de l\'établissement s\'appliquent.' },
      { ok: false, texte: 'Aucun paiement direct à l\'hôtel avant l\'arrivée ne remplace la réservation PHAROS.' },
      { ok: false, texte: 'Les tentatives de contournement du système de paiement sont sanctionnées.' },
    ],
  },
  {
    id: 'qrcode',
    icon: QrCode,
    couleur: 'text-purple-600',
    fond: 'bg-purple-50',
    bordure: 'border-purple-200',
    titre: 'Check-in par QR Code',
    regles: [
      { ok: true,  texte: 'Présentez votre QR Code à la réception pour un check-in rapide sans paperasse.' },
      { ok: true,  texte: 'Le QR Code est valable uniquement pour la date et l\'hôtel indiqués sur la réservation.' },
      { ok: true,  texte: 'En cas de perte d\'accès, contactez immédiatement le support PHAROS.' },
      { ok: false, texte: 'Le QR Code ne peut être utilisé qu\'une seule fois par séjour.' },
      { ok: false, texte: 'Toute reproduction ou falsification du QR Code est une infraction grave.' },
    ],
  },
]

export default function ReglesPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0D1B40] to-[#1a2f5e] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#F57C2B]/20 border border-[#F57C2B]/30 text-[#F57C2B] text-xs font-bold px-4 py-2 rounded-full mb-6 tracking-widest uppercase">
            <Shield size={14} />
            Plateforme de confiance
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
            Règles de la <span className="text-[#F57C2B]">plateforme</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Pour garantir une expérience équitable, sécurisée et agréable pour tous,
            chaque utilisateur de PHAROS s'engage à respecter les règles ci-dessous.
          </p>
        </div>
      </section>

      {/* Intro alerte */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-12 relative z-10">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <span className="font-bold">Important :</span> Le non-respect de ces règles peut entraîner la suspension
            ou la suppression définitive de votre compte sans remboursement. En utilisant PHAROS, vous acceptez
            l'ensemble de ces conditions.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pb-20">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.id} className={`border ${section.bordure} rounded-2xl overflow-hidden`}>
              {/* En-tête section */}
              <div className={`${section.fond} px-6 py-4 flex items-center gap-3 border-b ${section.bordure}`}>
                <div className={`w-10 h-10 rounded-xl ${section.fond} border ${section.bordure} flex items-center justify-center`}>
                  <Icon size={20} className={section.couleur} />
                </div>
                <h2 className={`text-lg font-black ${section.couleur}`}>{section.titre}</h2>
              </div>

              {/* Liste des règles */}
              <ul className="bg-white divide-y divide-gray-50">
                {section.regles.map((regle, i) => (
                  <li key={i} className="flex items-start gap-3 px-6 py-4">
                    {regle.ok
                      ? <CheckCircle size={17} className="text-green-500 shrink-0 mt-0.5" />
                      : <XCircle size={17} className="text-red-400 shrink-0 mt-0.5" />
                    }
                    <p className="text-sm text-gray-700 leading-relaxed">{regle.texte}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

        {/* Annulation */}
        <div className="bg-[#0D1B40] rounded-2xl px-6 py-8 text-white">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#F57C2B] rounded-full inline-block" />
            Politique d'annulation
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { delai: 'Dans les 2 h après paiement', action: 'Remboursement intégral', couleur: 'bg-green-500/15 border-green-500/30 text-green-300' },
              { delai: 'Après 2 h', action: 'Frais selon politique hôtel', couleur: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
              { delai: 'Jour d\'arrivée ou après', action: 'Annulation impossible', couleur: 'bg-red-500/15 border-red-500/30 text-red-300' },
            ].map((item) => (
              <div key={item.delai} className={`border rounded-xl px-4 py-4 ${item.couleur}`}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{item.delai}</p>
                <p className="font-bold text-base">{item.action}</p>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs mt-4">
            * Le taux de frais d'annulation après 2 h est défini par chaque établissement. Les cas de force majeure sont étudiés individuellement.
          </p>
        </div>

        {/* CTA contact */}
        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm mb-4">Une question sur ces règles ?</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-[#F57C2B] hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Contacter le support
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </Layout>
  )
}

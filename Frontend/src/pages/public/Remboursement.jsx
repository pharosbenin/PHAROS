import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, AlertTriangle, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Info } from 'lucide-react'
import Layout from '../../components/common/Layout'

const RESERVATIONS_CLIENT = [
  { id: 'RES-2026-001234', hotelNom: 'Hôtel du Lac', dateArrivee: '2026-06-10', dateDepart: '2026-06-12', total: 50000, commissionTaux: 3, tauxPenaliteHotel: 25 },
  { id: 'RES-2026-000891', hotelNom: 'Villa Ouidah Heritage', dateArrivee: '2026-07-15', dateDepart: '2026-07-18', total: 240000, commissionTaux: 5, tauxPenaliteHotel: 30 },
  { id: 'RES-2026-002100', hotelNom: 'Grand Hôtel de Parakou', dateArrivee: '2026-05-28', dateDepart: '2026-05-30', total: 60000, commissionTaux: 3, tauxPenaliteHotel: 20 },
  { id: 'RES-2026-002050', hotelNom: 'Résidence Bénin Palace', dateArrivee: '2026-05-20', dateDepart: '2026-05-22', total: 90000, commissionTaux: 5, tauxPenaliteHotel: 20 },
]

const MOTIFS = [
  'Changement de programme',
  'Problème personnel ou familial',
  'Problème de santé',
  'Voyage annulé',
  'Erreur lors de la réservation',
  'Autre raison',
]

export default function Remboursement() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [etape, setEtape] = useState('formulaire')
  const [reservationId, setReservationId] = useState(searchParams.get('id') || '')
  const [motif, setMotif] = useState('')
  const [details, setDetails] = useState('')
  const [erreur, setErreur] = useState('')
  const [regleOuverte, setRegleOuverte] = useState(false)

  const reservation = RESERVATIONS_CLIENT.find(r => r.id === reservationId)

  const calculerRemboursement = (r) => {
    if (!r) return null
    const maintenant = new Date()
    const arrivee = new Date(r.dateArrivee)
    const heuresAvant = (arrivee - maintenant) / 3600000

    const commission = Math.round(r.total * r.commissionTaux / 100)
    const escrow = r.total - commission

    if (heuresAvant <= 0) {
      return { commission, escrow, penalite: 0, remboursement: 0, dans24h: false, depasse: true }
    }

    const dans24h = heuresAvant <= 24
    const penalite = dans24h ? Math.round(escrow * r.tauxPenaliteHotel / 100) : 0
    const remboursement = escrow - penalite

    return { commission, escrow, penalite, remboursement, dans24h, depasse: false }
  }

  const calcul = calculerRemboursement(reservation)

  const soumettreFormulaire = (e) => {
    e.preventDefault()
    if (!reservationId) { setErreur('Sélectionnez une réservation'); return }
    if (!motif) { setErreur('Sélectionnez un motif'); return }
    if (calcul?.depasse) { setErreur('Cette réservation est déjà passée, le séjour a eu lieu.'); return }
    setErreur('')
    setEtape('confirmation')
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ChevronLeft size={18} />
          Retour
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Demande d'annulation</h1>
        <p className="text-gray-500 text-sm mb-6">
          La commission PHAROS est conservée dans tous les cas. Le remboursement dépend du délai avant votre arrivée.
        </p>

        {/* Règles PHAROS */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-6">
          <button
            onClick={() => setRegleOuverte(!regleOuverte)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Info size={18} className="text-blue-500" />
              <span className="font-semibold text-gray-900 text-sm">Règles d'annulation PHAROS</span>
            </div>
            {regleOuverte ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {regleOuverte && (
            <div className="px-5 pb-5 border-t border-gray-50 space-y-3 pt-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Commission PHAROS (3% ou 5%)</p>
                  <p className="text-xs text-blue-600 mt-0.5">Toujours conservée par PHAROS, même en cas d'annulation.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Annulation à plus de 24h de l'arrivée</p>
                  <p className="text-xs text-green-600 mt-0.5">Remboursement intégral de l'Escrow (hors commission). Aucune pénalité hôtel.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Annulation dans les 24h avant l'arrivée</p>
                  <p className="text-xs text-amber-600 mt-0.5">Le taux de pénalité fixé par l'hôtel s'applique sur l'Escrow. Le reste vous est remboursé.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {etape === 'formulaire' && (
          <form onSubmit={soumettreFormulaire}>
            {/* Sélection réservation */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
              <h2 className="font-semibold text-gray-900 mb-4">Quelle réservation annuler ?</h2>
              <div className="space-y-3">
                {RESERVATIONS_CLIENT.map(r => {
                  const c = calculerRemboursement(r)
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        reservationId === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio" name="reservation" value={r.id}
                        checked={reservationId === r.id}
                        onChange={() => setReservationId(r.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{r.hotelNom}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(r.dateArrivee).toLocaleDateString('fr-FR')} → {new Date(r.dateDepart).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">{r.total.toLocaleString()} FCFA · {r.id}</p>
                        {reservationId === r.id && c && (
                          <div className={`mt-2 text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1 font-medium ${
                            c.dans24h ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                          }`}>
                            <Clock size={10} />
                            {c.dans24h ? `Pénalité hôtel (${r.tauxPenaliteHotel}%) applicable` : 'Aucune pénalité hôtel'}
                          </div>
                        )}
                      </div>
                      {reservationId === r.id && c && !c.depasse && (
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">Vous recevez</p>
                          <p className="font-bold text-sm text-green-600">{c.remboursement.toLocaleString()} FCFA</p>
                          <p className="text-xs text-gray-400">sur {r.total.toLocaleString()}</p>
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Décomposition si sélection */}
            {reservation && calcul && !calcul.depasse && (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Décomposition du remboursement</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Montant total payé</span>
                    <span className="font-medium">{reservation.total.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                      Commission PHAROS ({reservation.commissionTaux}%) — conservée
                    </span>
                    <span className="font-semibold text-blue-600">-{calcul.commission.toLocaleString()} FCFA</span>
                  </div>
                  {calcul.dans24h && (
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                        Pénalité hôtel ({reservation.tauxPenaliteHotel}%) — dans les 24h
                      </span>
                      <span className="font-semibold text-amber-600">-{calcul.penalite.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-3 font-bold text-base">
                    <span className="text-gray-900">Remboursement estimé</span>
                    <span className="text-green-600">{calcul.remboursement.toLocaleString()} FCFA</span>
                  </div>
                </div>
                {!calcul.dans24h && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle size={11} />
                    Annulation avant les 24h — aucune pénalité hôtel appliquée
                  </p>
                )}
                {calcul.dans24h && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    Annulation dans les 24h avant arrivée — pénalité hôtel de {reservation.tauxPenaliteHotel}% appliquée
                  </p>
                )}
              </div>
            )}

            {/* Motif */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
              <h2 className="font-semibold text-gray-900 mb-4">Motif d'annulation</h2>
              <div className="space-y-2">
                {MOTIFS.map(m => (
                  <label key={m} className="flex items-center gap-3 py-1 cursor-pointer">
                    <input type="radio" name="motif" value={m} checked={motif === m}
                      onChange={() => setMotif(m)} className="text-blue-600" />
                    <span className="text-sm text-gray-700">{m}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-400 font-medium block mb-1">Détails supplémentaires (optionnel)</label>
                <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3}
                  placeholder="Expliquez votre situation si nécessaire..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>

            {erreur && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <XCircle size={16} className="text-red-500" />
                <p className="text-sm text-red-600">{erreur}</p>
              </div>
            )}

            <button type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors">
              Demander l'annulation
            </button>
          </form>
        )}

        {etape === 'confirmation' && reservation && calcul && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Confirmer l'annulation</h2>
                <p className="text-xs text-gray-400">Cette action est irréversible</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Réservation</span>
                <span className="font-medium text-gray-800">{reservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hôtel</span>
                <span className="font-medium text-gray-800">{reservation.hotelNom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant payé</span>
                <span className="font-medium text-gray-800">{reservation.total.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Motif</span>
                <span className="font-medium text-gray-800">{motif}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Commission PHAROS conservée ({reservation.commissionTaux}%)</span>
                  <span className="font-medium text-blue-600">{calcul.commission.toLocaleString()} FCFA</span>
                </div>
                {calcul.dans24h && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Pénalité hôtel ({reservation.tauxPenaliteHotel}% — dans les 24h)</span>
                    <span className="font-medium text-amber-600">{calcul.penalite.toLocaleString()} FCFA</span>
                  </div>
                )}
              </div>
              <div className={`flex justify-between p-3 rounded-xl border ${calcul.remboursement === reservation.total - calcul.commission ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <span className="font-semibold text-gray-700">Remboursement estimé</span>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">{calcul.remboursement.toLocaleString()} FCFA</p>
                  <p className="text-xs text-gray-400">via Mobile Money sous 3-5 jours ouvrés</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEtape('formulaire')}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm">
                Retour
              </button>
              <button onClick={() => setEtape('soumis')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Confirmer l'annulation
              </button>
            </div>
          </div>
        )}

        {etape === 'soumis' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée</h2>
            <p className="text-gray-500 text-sm mb-4">
              Votre demande d'annulation a été transmise. Le remboursement sera effectué sous <strong>3 à 5 jours ouvrés</strong>.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left text-sm mb-6">
              <p className="font-semibold text-blue-800 mb-1">Rappel</p>
              <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                <li>La commission PHAROS reste acquise à la plateforme</li>
                <li>Le remboursement est crédité sur votre compte Mobile Money</li>
                <li>Un email de confirmation vous sera envoyé</li>
              </ul>
            </div>
            <button onClick={() => navigate('/client/espace')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">
              Voir mes réservations
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

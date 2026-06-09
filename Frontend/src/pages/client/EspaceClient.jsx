import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  Calendar, MapPin, QrCode, Star, Clock, CheckCircle, XCircle, RotateCcw,
  ChevronRight, User, Mail, Phone, Edit3, LogOut, AlertCircle, Smartphone,
  X, Building2, Key, Trash2, FileText, Shield, Info, Loader2, Utensils
} from 'lucide-react'
import Layout from '../../components/common/Layout'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const RESERVATIONS_INIT = [
  {
    id: 'RES-2026-001234',
    hotelId: 1,
    hotelNom: 'Hôtel du Lac',
    hotelVille: 'Cotonou',
    hotelPhoto: '/hotels/hotel-du-lac/exterieur/HL1.jpeg',
    dateArrivee: '2026-06-10',
    dateDepart: '2026-06-12',
    nuits: 2,
    voyageurs: 1,
    chambres: [{ type: 'Chambre Standard', quantite: 1, prix: 25000 }],
    total: 50000,
    statut: 'confirmee',
    methode: 'MTN Mobile Money',
    commissionTaux: 3,
    tauxPenaliteHotel: 25,
    paiementRecent: false,
    chambresDisponibles: [
      { id: 1, type: 'Chambre Standard', prix: 25000, capacite: 2 },
      { id: 2, type: 'Chambre Supérieure', prix: 35000, capacite: 3 },
      { id: 3, type: 'Suite Junior', prix: 55000, capacite: 2 },
    ],
  },
  {
    id: 'RES-2026-000891',
    hotelId: 2,
    hotelNom: 'Villa Ouidah Heritage',
    hotelVille: 'Ouidah',
    hotelPhoto: '/hotels/villa-ouidah-heritage/exterieur/VO1.jpeg',
    dateArrivee: '2026-07-15',
    dateDepart: '2026-07-18',
    nuits: 3,
    voyageurs: 2,
    chambres: [{ type: 'Suite Exécutive', quantite: 1, prix: 80000 }],
    total: 240000,
    statut: 'en_attente',
    methode: 'Moov Money',
    commissionTaux: 5,
    tauxPenaliteHotel: 30,
    paiementRecent: true,
    chambresDisponibles: [
      { id: 1, type: 'Chambre Deluxe', prix: 55000, capacite: 2 },
      { id: 2, type: 'Suite Junior', prix: 70000, capacite: 3 },
      { id: 3, type: 'Suite Exécutive', prix: 80000, capacite: 4 },
    ],
  },
  {
    id: 'RES-2026-002100',
    hotelId: 3,
    hotelNom: 'Grand Hôtel de Parakou',
    hotelVille: 'Parakou',
    hotelPhoto: '/hotels/grand-hotel-parakou/exterieur/GP1.jpeg',
    dateArrivee: '2026-05-28',
    dateDepart: '2026-05-30',
    nuits: 2,
    voyageurs: 1,
    chambres: [{ type: 'Chambre Supérieure', quantite: 1, prix: 30000 }],
    total: 60000,
    statut: 'a_confirmer',
    methode: 'MTN Mobile Money',
    commissionTaux: 3,
    tauxPenaliteHotel: 20,
    paiementRecent: false,
    chambresDisponibles: [],
  },
  {
    id: 'RES-2026-002050',
    hotelId: 4,
    hotelNom: 'Résidence Bénin Palace',
    hotelVille: 'Cotonou',
    hotelPhoto: '/hotels/residence-benin-palace/exterieur/BP1.jpeg',
    dateArrivee: '2026-05-20',
    dateDepart: '2026-05-22',
    nuits: 2,
    voyageurs: 2,
    chambres: [{ type: 'Suite Junior', quantite: 1, prix: 45000 }],
    total: 90000,
    statut: 'confirme_hotel',
    methode: 'Moov Money',
    commissionTaux: 5,
    tauxPenaliteHotel: 20,
    paiementRecent: false,
    chambresDisponibles: [],
  },
  {
    id: 'RES-2025-008812',
    hotelId: 5,
    hotelNom: 'Grand Hôtel de Dassa',
    hotelVille: 'Dassa-Zoumè',
    hotelPhoto: '/hotels/grand-hotel-dassa/exterieur/GD1.jpeg',
    dateArrivee: '2025-12-24',
    dateDepart: '2025-12-27',
    nuits: 3,
    voyageurs: 2,
    chambres: [{ type: 'Chambre Supérieure', quantite: 2, prix: 35000 }],
    total: 210000,
    statut: 'terminee',
    methode: 'MTN Mobile Money',
    commissionTaux: 3,
    tauxPenaliteHotel: 25,
    paiementRecent: false,
    chambresDisponibles: [],
  },
  {
    id: 'RES-2025-005541',
    hotelId: 6,
    hotelNom: 'Résidence Palm Beach',
    hotelVille: 'Cotonou',
    hotelPhoto: '/hotels/residence-palm-beach/exterieur/PB1.jpeg',
    dateArrivee: '2025-08-01',
    dateDepart: '2025-08-03',
    nuits: 2,
    voyageurs: 1,
    chambres: [{ type: 'Chambre Standard', quantite: 1, prix: 18000 }],
    total: 36000,
    statut: 'annulee',
    methode: 'MTN Mobile Money',
    commissionTaux: 3,
    tauxPenaliteHotel: 20,
    paiementRecent: false,
    chambresDisponibles: [],
  },
]

const STATUTS = {
  en_attente: { label: 'En attente', couleur: 'bg-amber-100 text-amber-700', icon: Clock },
  payee: { label: 'Payée', couleur: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  confirmee: { label: 'Confirmée', couleur: 'bg-green-100 text-green-700', icon: CheckCircle },
  en_cours: { label: 'En cours', couleur: 'bg-indigo-100 text-indigo-700', icon: Clock },
  a_confirmer: { label: 'À confirmer', couleur: 'bg-purple-100 text-purple-700', icon: AlertCircle },
  confirme_client: { label: 'En attente hôtel', couleur: 'bg-indigo-100 text-indigo-700', icon: Clock },
  confirme_hotel: { label: 'Hôtel confirmé', couleur: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  terminee: { label: 'Terminée', couleur: 'bg-gray-100 text-gray-600', icon: CheckCircle },
  annulee: { label: 'Annulée', couleur: 'bg-red-100 text-red-500', icon: XCircle },
  remboursee: { label: 'Remboursée', couleur: 'bg-teal-100 text-teal-700', icon: RotateCcw },
}

function QRMini({ valeur }) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-1 bg-white inline-block">
      <QRCodeSVG value={valeur} size={64} level="M" />
    </div>
  )
}

function ModalModification({ reservation, onFermer, onValider }) {
  const now = new Date()
  const arrivee = new Date(reservation.dateArrivee)
  const heuresAvantArrivee = (arrivee - now) / 3600000
  const peutModifier = heuresAvantArrivee > 24

  const chambreActuelle = reservation.chambres[0]
  const [chambresDisponibles, setChambresDisponibles] = useState(reservation.chambresDisponibles)
  const [loadingChambres, setLoadingChambres] = useState(false)
  const [selectedChambre, setSelectedChambre] = useState(
    reservation.chambresDisponibles.find(c => c.type === chambreActuelle.type) ||
    reservation.chambresDisponibles[0] || null
  )
  const [dateArrivee, setDateArrivee] = useState(reservation.dateArrivee)
  const [dateDepart, setDateDepart] = useState(reservation.dateDepart)
  const [voyageurs, setVoyageurs] = useState(reservation.voyageurs || 1)
  const [telephone, setTelephone] = useState('')

  useEffect(() => {
    if (!dateArrivee || !dateDepart || !reservation.hotelId || dateArrivee >= dateDepart) return
    setLoadingChambres(true)
    api.get('/chambres/disponibles/', {
      params: { hotel: reservation.hotelId, arrivee: dateArrivee, depart: dateDepart }
    })
      .then(res => {
        const chambres = res.data
        setChambresDisponibles(chambres)
        const memeType = chambres.find(c => c.type === chambreActuelle.type)
        setSelectedChambre(memeType || chambres[0] || null)
      })
      .catch(() => setChambresDisponibles(reservation.chambresDisponibles))
      .finally(() => setLoadingChambres(false))
  }, [dateArrivee, dateDepart])

  const minDateArrivee = new Date(Date.now() + 25 * 3600000).toISOString().split('T')[0]

  const nuits = dateArrivee && dateDepart
    ? Math.max(0, Math.round((new Date(dateDepart) - new Date(dateArrivee)) / 86400000))
    : 0

  const prixChambre = selectedChambre?.prix || chambreActuelle.prix
  const newTotal = nuits > 0 ? prixChambre * nuits : 0
  const oldTotal = reservation.total
  const diff = newTotal - oldTotal
  const isHausse = diff > 0
  const isBaisse = diff < 0

  const commissionDiff = Math.round(Math.abs(diff) * reservation.commissionTaux / 100)
  const escrowDiff = Math.abs(diff) - commissionDiff
  const penalite = isBaisse
    ? (reservation.paiementRecent ? 0 : Math.round(escrowDiff * reservation.tauxPenaliteHotel / 100))
    : 0
  const remboursement = isBaisse
    ? (reservation.paiementRecent ? Math.abs(diff) : escrowDiff - penalite)
    : 0

  const somethingChanged =
    dateArrivee !== reservation.dateArrivee ||
    dateDepart !== reservation.dateDepart ||
    (selectedChambre && selectedChambre.type !== chambreActuelle.type) ||
    voyageurs !== (reservation.voyageurs || 1)

  const formValide = nuits > 0 && somethingChanged && (!isHausse || telephone.length >= 8) && !loadingChambres

  if (!peutModifier) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Modification impossible</h2>
            <button onClick={onFermer} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Délai dépassé</p>
              <p className="text-xs text-red-600 mt-1">La modification n'est plus possible à moins de 24h de la date d'arrivée.</p>
            </div>
          </div>
          <button onClick={onFermer} className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Modifier la réservation</h2>
            <p className="text-xs text-gray-400 mt-0.5">{reservation.hotelNom} · <span className="font-mono">{reservation.id}</span></p>
          </div>
          <button onClick={onFermer} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Règle 2h */}
          <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${reservation.paiementRecent ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
            <Info size={14} className="shrink-0 mt-0.5" />
            {reservation.paiementRecent
              ? 'Paiement effectué il y a moins de 2h — toute réduction sera remboursée intégralement, sans pénalité.'
              : `Règle de modification : en cas de réduction, une pénalité de ${reservation.tauxPenaliteHotel}% définie par l'hôtel sera retenue.`}
          </div>

          {/* Chambre */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1.5">Type de chambre</label>
            {loadingChambres ? (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Chargement des chambres disponibles...
              </div>
            ) : chambresDisponibles.length > 0 ? (
              <select
                value={selectedChambre?.id || ''}
                onChange={e => setSelectedChambre(chambresDisponibles.find(c => c.id === parseInt(e.target.value)))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white"
              >
                {chambresDisponibles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.type} — {c.prix.toLocaleString()} FCFA/nuit (max {c.capacite} pers.)
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full border border-orange-200 bg-orange-50 rounded-xl px-4 py-3 text-sm text-orange-600">
                Aucune autre chambre disponible pour ces dates
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Actuellement : {chambreActuelle.type} — {chambreActuelle.prix.toLocaleString()} FCFA/nuit</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">Date d'arrivée</label>
              <input type="date" value={dateArrivee}
                min={minDateArrivee}
                onChange={e => { setDateArrivee(e.target.value); if (dateDepart <= e.target.value) setDateDepart('') }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">Date de départ</label>
              <input type="date" value={dateDepart}
                min={dateArrivee || minDateArrivee}
                onChange={e => setDateDepart(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
          {nuits > 0 && (
            <p className="text-xs text-blue-600 font-medium -mt-3 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
              {nuits} nuit{nuits > 1 ? 's' : ''} · nouveau total : {(prixChambre * nuits).toLocaleString()} FCFA
            </p>
          )}

          {/* Voyageurs */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1.5">Nombre de voyageurs</label>
            <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 w-fit">
              <button onClick={() => setVoyageurs(v => Math.max(1, v - 1))}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-base leading-none transition-colors">−</button>
              <span className="text-sm font-semibold w-5 text-center">{voyageurs}</span>
              <button onClick={() => setVoyageurs(v => Math.min(selectedChambre?.capacite || 4, v + 1))}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-base leading-none transition-colors">+</button>
              {selectedChambre && (
                <span className="text-xs text-gray-400 ml-1">max {selectedChambre.capacite} pers.</span>
              )}
            </div>
          </div>

          {/* Récapitulatif financier */}
          {nuits > 0 && newTotal !== oldTotal && (
            <div className={`rounded-xl border p-4 ${isHausse ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isHausse ? 'text-green-700' : 'text-amber-700'}`}>
                {isHausse ? 'Supplément à régler' : 'Remboursement estimé'}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Montant actuel</span>
                  <span>{oldTotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Nouveau montant</span>
                  <span>{newTotal.toLocaleString()} FCFA</span>
                </div>
                {isHausse && (
                  <div className="flex justify-between border-t border-green-200 pt-2 font-bold text-green-800">
                    <span>Supplément à payer</span>
                    <span>+{diff.toLocaleString()} FCFA</span>
                  </div>
                )}
                {isBaisse && (
                  <>
                    {!reservation.paiementRecent && (
                      <>
                        <div className="flex justify-between text-gray-500 text-xs pt-1">
                          <span>Commission PHAROS ({reservation.commissionTaux}%) — acquise</span>
                          <span>−{commissionDiff.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs">
                          <span>Pénalité hôtel ({reservation.tauxPenaliteHotel}%)</span>
                          <span>−{penalite.toLocaleString()} FCFA</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between border-t border-amber-200 pt-2 font-bold">
                      <span className="text-gray-800">Vous serez remboursé</span>
                      <span className="text-green-700">{remboursement.toLocaleString()} FCFA</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Note info si aucun changement financier */}
          {nuits > 0 && newTotal === oldTotal && somethingChanged && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-center gap-2">
              <Info size={14} className="shrink-0" />
              Aucune différence de montant — modification sans frais ni remboursement.
            </div>
          )}

          {/* Paiement Mobile Money si hausse */}
          {isHausse && nuits > 0 && (
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">Numéro Mobile Money pour le supplément</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors">
                <Smartphone size={15} className="text-gray-400 shrink-0" />
                <span className="text-gray-500 text-sm font-medium">+229</span>
                <div className="w-px h-5 bg-gray-200" />
                <input type="tel" value={telephone}
                  onChange={e => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="XXXXXXXX"
                  className="flex-1 text-sm text-gray-800 outline-none" />
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onFermer}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button
              disabled={!formValide}
              onClick={() => {
                onValider(
                  isHausse ? 'hausse' : isBaisse ? 'baisse' : 'same',
                  newTotal,
                  isHausse ? diff : isBaisse ? remboursement : 0,
                  { dateArrivee, dateDepart, nuits, voyageurs, chambre: selectedChambre || chambreActuelle }
                )
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              {isHausse && nuits > 0
                ? `Payer ${diff.toLocaleString()} FCFA`
                : isBaisse && nuits > 0
                  ? `Confirmer — rembours. ${remboursement.toLocaleString()} FCFA`
                  : 'Confirmer la modification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalAnnulation({ reservation, onFermer, onConfirmer }) {
  const now = new Date()
  const arrivee = new Date(reservation.dateArrivee)
  const heuresAvantArrivee = (arrivee - now) / 3600000
  const peutAnnuler = heuresAvantArrivee > 24

  const commission = Math.round(reservation.total * reservation.commissionTaux / 100)
  const escrow = reservation.total - commission
  const penalite = reservation.paiementRecent ? 0 : Math.round(escrow * reservation.tauxPenaliteHotel / 100)
  const remboursement = reservation.paiementRecent ? reservation.total : escrow - penalite

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  if (!peutAnnuler) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Annulation impossible</h2>
            <button onClick={onFermer} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Délai dépassé</p>
              <p className="text-xs text-red-600 mt-1">L'annulation n'est plus possible à moins de 24h de la date d'arrivée ({formatDate(reservation.dateArrivee)}).</p>
            </div>
          </div>
          <button onClick={onFermer} className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Annuler la réservation</h2>
          <button onClick={onFermer} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Résumé réservation */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900">{reservation.hotelNom}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{reservation.id}</p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDate(reservation.dateArrivee)} → {formatDate(reservation.dateDepart)} · {reservation.nuits} nuit{reservation.nuits > 1 ? 's' : ''}
            </p>
          </div>

          {/* Règle applicable */}
          <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${reservation.paiementRecent ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
            <Info size={14} className="shrink-0 mt-0.5" />
            {reservation.paiementRecent
              ? 'Paiement effectué il y a moins de 2h — vous serez remboursé intégralement.'
              : `Annulation au-delà de 2h après paiement — le taux d'annulation de l'hôtel (${reservation.tauxPenaliteHotel}%) s'applique.`}
          </div>

          {/* Détail remboursement */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Détail du remboursement</p>
            <div className="flex justify-between text-gray-700">
              <span>Montant total payé</span>
              <span className="font-medium">{reservation.total.toLocaleString()} FCFA</span>
            </div>
            {!reservation.paiementRecent && (
              <>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Commission PHAROS ({reservation.commissionTaux}%) — acquise</span>
                  <span>−{commission.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Pénalité hôtel ({reservation.tauxPenaliteHotel}%)</span>
                  <span>−{penalite.toLocaleString()} FCFA</span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-3 font-bold">
              <span className="text-gray-900">Vous recevez</span>
              <span className="text-green-600 text-base">{remboursement.toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Info délai */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-center gap-2">
            <Shield size={14} className="shrink-0" />
            Remboursement sur votre Mobile Money sous 24 à 72h ouvrées.
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onFermer}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Conserver
            </button>
            <button onClick={() => onConfirmer(reservation.id, remboursement)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              Annuler la réservation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CarteReservation({ reservation, onConfirmerSejour, onModifier, onAnnuler }) {
  const [qrOuvert, setQrOuvert] = useState(false)
  const [avisOuvert, setAvisOuvert] = useState(false)
  const [note, setNote] = useState(reservation.noteClient || 0)
  const [commentaire, setCommentaire] = useState('')
  const [avisEnvoye, setAvisEnvoye] = useState(!!reservation.noteClient)
  const [avisEnvoi, setAvisEnvoi] = useState(false)
  const [avisErreur, setAvisErreur] = useState('')

  const now = new Date()
  const arrivee = new Date(reservation.dateArrivee)
  const depart = new Date(reservation.dateDepart)
  const heuresAvantArrivee = (arrivee - now) / 3600000
  const dans24h = heuresAvantArrivee <= 24 && heuresAvantArrivee > 0
  // Confirmation possible 5h avant la date de départ
  const peutConfirmer = now >= new Date(depart.getTime() - 5 * 3600 * 1000)

  const statut = STATUTS[reservation.statut]
  const IconeStatut = statut.icon
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  const peutAgir = ['confirmee', 'en_attente', 'payee'].includes(reservation.statut)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-28 relative overflow-hidden">
        {reservation.hotelPhoto
          ? <img src={reservation.hotelPhoto} alt={reservation.hotelNom} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center"><Building2 size={36} className="text-blue-300" /></div>
        }
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statut.couleur}`}>
          <IconeStatut size={11} />
          {statut.label}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{reservation.hotelNom}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin size={10} /> {reservation.hotelVille}
            </p>
          </div>
          <p className="text-xs text-gray-400 font-mono shrink-0">{reservation.id}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Calendar size={12} className="text-blue-400" />
          {formatDate(reservation.dateArrivee)} → {formatDate(reservation.dateDepart)}
          <span className="text-blue-600 font-medium">· {reservation.nuits} nuit{reservation.nuits > 1 ? 's' : ''}</span>
        </div>

        {reservation.voyageurs && (
          <p className="text-xs text-gray-400 mb-2">{reservation.voyageurs} voyageur{reservation.voyageurs > 1 ? 's' : ''}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            {reservation.chambres.map((c, i) => (
              <p key={i} className="text-xs text-gray-600">{c.type} × {c.quantite}</p>
            ))}
          </div>
          <p className="font-bold text-blue-600 text-sm">{reservation.total.toLocaleString()} FCFA</p>
        </div>

        {/* Alerte 24h */}
        {peutAgir && dans24h && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs border bg-orange-50 text-orange-700 border-orange-100 flex items-center gap-1.5">
            <AlertCircle size={12} />
            Modification et annulation impossibles dans les 24h précédant l'arrivée.
          </div>
        )}

        {/* Alerte escrow — en attente de confirmation */}
        {['payee', 'confirmee', 'en_cours'].includes(reservation.statut) && !peutConfirmer && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs border bg-blue-50 text-blue-700 border-blue-100 flex items-start gap-1.5">
            <Shield size={11} className="shrink-0 mt-0.5" />
            Fonds sécurisés par PHAROS. Confirmation possible à partir du {formatDate(reservation.dateDepart)}.
          </div>
        )}
        {['payee', 'confirmee', 'en_cours'].includes(reservation.statut) && peutConfirmer && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs border bg-purple-50 text-purple-700 border-purple-100 flex items-start gap-1.5">
            <AlertCircle size={11} className="shrink-0 mt-0.5" />
            Séjour bientôt terminé. Confirmez pour déclencher le transfert des fonds à l'hôtel (double confirmation requise).
          </div>
        )}
        {reservation.statut === 'confirme_client' && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs border bg-indigo-50 text-indigo-700 border-indigo-100 flex items-start gap-1.5">
            <CheckCircle size={11} className="shrink-0 mt-0.5" />
            Votre confirmation a été enregistrée. En attente de la confirmation de l'hôtel pour libérer les fonds.
          </div>
        )}
        {reservation.statut === 'confirme_hotel' && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs border bg-amber-50 text-amber-700 border-amber-100 flex items-start gap-1.5">
            <AlertCircle size={11} className="shrink-0 mt-0.5" />
            L'hôtel a confirmé votre séjour. Confirmez à votre tour pour libérer les fonds.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
          {['payee', 'confirmee', 'en_cours'].includes(reservation.statut) && (
            <button onClick={() => setQrOuvert(!qrOuvert)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <QrCode size={12} /> QR Code
            </button>
          )}

          {['payee', 'confirmee', 'en_cours', 'confirme_hotel', 'confirme_client'].includes(reservation.statut) && (
            <Link to={`/client/reservation/${reservation.id}/restaurant`}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <Utensils size={12} /> Commander au restaurant
            </Link>
          )}

          {peutAgir && (
            <>
              <button onClick={() => onModifier(reservation)}
                className="flex items-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <Edit3 size={12} /> Modifier
              </button>
              <button onClick={() => onAnnuler(reservation)}
                className="flex items-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <RotateCcw size={12} /> Annuler
              </button>
            </>
          )}

          {(['payee', 'confirmee', 'en_cours'].includes(reservation.statut) && peutConfirmer) ||
           reservation.statut === 'confirme_hotel' ? (
            <button onClick={() => onConfirmerSejour(reservation.id)}
              className="w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
              <CheckCircle size={12} />
              {reservation.statut === 'confirme_hotel' ? 'Confirmer — libérer les fonds' : 'Confirmer mon séjour'}
            </button>
          ) : null}

          {reservation.statut === 'terminee' && !avisEnvoye && (
            <button onClick={() => setAvisOuvert(!avisOuvert)}
              className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
              <Star size={12} /> Laisser un avis
            </button>
          )}
          {reservation.statut === 'terminee' && avisEnvoye && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              {[...Array(note)].map((_, i) => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
              <span className="ml-1 text-gray-400">Avis publié</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        {qrOuvert && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
            <QRMini valeur={reservation.id} />
            <div>
              <p className="text-xs font-semibold text-gray-800">QR Code de check-in</p>
              <p className="text-xs text-gray-400 mt-0.5">Présentez à la réception à l'arrivée</p>
              <p className="text-xs text-blue-600 font-mono mt-1">{reservation.id}</p>
            </div>
          </div>
        )}

        {/* Formulaire avis */}
        {avisOuvert && !avisEnvoye && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-700 mb-2">Votre note pour {reservation.hotelNom}</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setNote(n)}>
                  <Star size={24} className={n <= note ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                </button>
              ))}
            </div>
            <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={2}
              placeholder="Partagez votre expérience (optionnel)..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 resize-none" />
            {avisErreur && <p className="text-red-500 text-xs mt-1">{avisErreur}</p>}
            <button
              onClick={async () => {
                if (note === 0) return
                setAvisEnvoi(true)
                setAvisErreur('')
                try {
                  await api.post('/avis/', {
                    hotel: reservation.hotelId,
                    reservation: reservation.reservationPk,
                    note,
                    commentaire,
                  })
                  setAvisEnvoye(true)
                  setAvisOuvert(false)
                } catch (err) {
                  const data = err.response?.data
                  const msg = data?.non_field_errors?.[0] || data?.detail || Object.values(data || {})[0] || 'Erreur lors de la publication.'
                  setAvisErreur(typeof msg === 'string' ? msg : JSON.stringify(msg))
                } finally {
                  setAvisEnvoi(false)
                }
              }}
              disabled={note === 0 || avisEnvoi}
              className="mt-2 w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1">
              {avisEnvoi ? <Loader2 size={12} className="animate-spin" /> : null}
              {avisEnvoi ? 'Publication...' : 'Publier l\'avis'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EspaceClient() {
  const { user, logout } = useAuth()
  const [onglet, setOnglet] = useState('reservations')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [reservations, setReservations] = useState([])
  const [chargementRes, setChargementRes] = useState(true)
  const [modalModif, setModalModif] = useState(null)
  const [modalAnnul, setModalAnnul] = useState(null)
  const [notif, setNotif] = useState(null)

  // Charger les vraies réservations depuis le backend
  useEffect(() => {
    api.get('/client/reservations/')
      .then(res => {
        const data = res.data.map(r => ({
          id: r.numero,
          reservationPk: r.id,
          hotelId: r.hotel_id,
          hotelNom: r.hotel_nom,
          hotelVille: r.hotel_ville,
          hotelPhoto: null,
          dateArrivee: r.date_arrivee,
          dateDepart: r.date_depart,
          nuits: r.nb_nuits,
          voyageurs: r.nb_adultes ?? 1,
          chambres: [{ type: r.type_chambre_nom, quantite: 1, prix: parseFloat(r.prix_total) / (r.nb_nuits || 1) }],
          total: parseFloat(r.prix_total),
          statut: r.statut,
          methode: 'Mobile Money',
          commissionTaux: 3,
          tauxPenaliteHotel: 20,
          paiementRecent: false,
          chambresDisponibles: [],
        }))
        setReservations(data)
      })
      .catch(() => setReservations([]))
      .finally(() => setChargementRes(false))
  }, [])

  const afficherNotif = (msg, type = 'succes') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 5000)
  }

  const confirmerSejour = async (id) => {
    try {
      const res = await api.post(`/reservations/${id}/confirmer-sejour/`)
      const nouveauStatut = res.data.statut
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, statut: nouveauStatut } : r
      ))
      afficherNotif(res.data.message)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur lors de la confirmation.'
      afficherNotif(msg, 'erreur')
    }
  }

  const validerModification = (type, nouveauTotal, montant, details) => {
    setReservations(prev => prev.map(r => {
      if (r.id !== modalModif.id) return r
      return {
        ...r,
        total: nouveauTotal,
        dateArrivee: details.dateArrivee,
        dateDepart: details.dateDepart,
        nuits: details.nuits,
        voyageurs: details.voyageurs,
        chambres: [{ type: details.chambre.type, quantite: 1, prix: details.chambre.prix }],
      }
    }))
    afficherNotif(
      type === 'hausse'
        ? `Modification confirmée. Supplément de ${montant.toLocaleString()} FCFA débité.`
        : type === 'baisse'
          ? `Modification confirmée. Remboursement de ${montant.toLocaleString()} FCFA sous 24-72h.`
          : 'Modification de votre réservation enregistrée.'
    )
    setModalModif(null)
  }

  const confirmerAnnulation = (id, remboursement) => {
    setReservations(prev => prev.map(r =>
      r.id === id ? { ...r, statut: 'annulee' } : r
    ))
    afficherNotif(`Réservation annulée. Remboursement de ${remboursement.toLocaleString()} FCFA sous 24-72h.`)
    setModalAnnul(null)
  }

  const reservationsFiltrees = filtreStatut === 'tous'
    ? reservations
    : reservations.filter(r => r.statut === filtreStatut)

  const nbAConfirmer = reservations.filter(r => ['a_confirmer', 'confirme_hotel'].includes(r.statut)).length

  const stats = {
    total: reservations.length,
    confirmees: reservations.filter(r => ['payee', 'confirmee', 'en_cours'].includes(r.statut)).length,
    aConfirmer: nbAConfirmer,
    depense: reservations.filter(r => !['annulee', 'remboursee'].includes(r.statut)).reduce((s, r) => s + r.total, 0),
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Notification */}
        {notif && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm animate-in">
            <CheckCircle size={16} /> {notif.msg}
          </div>
        )}

        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user?.prenom || 'Jean'}</h1>
            <p className="text-gray-400 text-sm mt-0.5">Bienvenue dans votre espace personnel</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-red-500 text-sm transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>

        {/* Alerte séjours à confirmer */}
        {nbAConfirmer > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-800 text-sm">
                {nbAConfirmer} séjour{nbAConfirmer > 1 ? 's' : ''} à confirmer
              </p>
              <p className="text-xs text-purple-600 mt-0.5">
                Confirmez vos séjours terminés pour déclencher le transfert des fonds à l'hôtel.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Réservations', valeur: stats.total, couleur: 'text-blue-600' },
            { label: 'À venir', valeur: stats.confirmees, couleur: 'text-green-600' },
            { label: 'À confirmer', valeur: stats.aConfirmer, couleur: stats.aConfirmer > 0 ? 'text-purple-600' : 'text-gray-400' },
            { label: 'Total dépensé', valeur: stats.depense.toLocaleString() + ' FCFA', couleur: 'text-blue-600' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-2xl border p-4 text-center ${i === 2 && stats.aConfirmer > 0 ? 'border-purple-200' : 'border-gray-100'}`}>
              <p className={`text-xl font-black ${s.couleur}`}>{s.valeur}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[{ id: 'reservations', label: 'Mes réservations' }, { id: 'profil', label: 'Mon profil' }].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${onglet === o.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {o.label}
            </button>
          ))}
        </div>

        {/* RÉSERVATIONS */}
        {onglet === 'reservations' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { val: 'tous', label: 'Toutes' },
                { val: 'payee', label: 'Payées' },
                { val: 'confirmee', label: 'Confirmées' },
                { val: 'en_attente', label: 'En attente' },
                { val: 'terminee', label: 'Terminées' },
                { val: 'annulee', label: 'Annulées' },
              ].map(f => (
                <button key={f.val} onClick={() => setFiltreStatut(f.val)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    filtreStatut === f.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {chargementRes ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Loader2 size={32} className="text-blue-500 mx-auto mb-3 animate-spin" />
                <p className="text-gray-500 text-sm">Chargement de vos réservations...</p>
              </div>
            ) : reservationsFiltrees.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-700">
                  {filtreStatut === 'tous' ? 'Vous n\'avez pas encore de réservation' : 'Aucune réservation dans cette catégorie'}
                </p>
                <Link to="/recherche" className="mt-4 inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline">
                  Trouver un hébergement <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservationsFiltrees.map(r => (
                  <CarteReservation
                    key={r.id}
                    reservation={r}
                    onConfirmerSejour={confirmerSejour}
                    onModifier={setModalModif}
                    onAnnuler={setModalAnnul}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <Link to="/recherche"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                Réserver un nouvel hébergement <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {/* PROFIL */}
        {onglet === 'profil' && (
          <div className="max-w-xl">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Informations personnelles</h2>
                <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <Edit3 size={13} /> Modifier
                </button>
              </div>
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-50">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-black text-blue-600">
                    {(user?.prenom || 'J')[0]}{(user?.nom || 'D')[0]}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{user?.prenom} {user?.nom}</p>
                  <p className="text-xs text-gray-400">Client PHAROS</p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                {[
                  { icon: User, label: 'Prénom', valeur: user?.prenom || 'Jean' },
                  { icon: User, label: 'Nom', valeur: user?.nom || 'Dupont' },
                  { icon: Mail, label: 'Email', valeur: user?.email || 'jean@email.com' },
                  { icon: Phone, label: 'Téléphone', valeur: user?.telephone || '+229 97 00 00 00' },
                ].map((champ, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <champ.icon size={15} className="text-gray-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">{champ.label}</p>
                      <p className="font-medium text-gray-800">{champ.valeur}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Sécurité</h2>
              <button className="flex items-center justify-between w-full py-3 border-b border-gray-50 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Key size={16} className="text-gray-500" /></div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">Changer le mot de passe</p>
                    <p className="text-xs text-gray-400">Dernière modification : il y a 3 mois</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
              </button>
              <button className="flex items-center justify-between w-full py-3 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Trash2 size={16} className="text-red-400" /></div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-500">Supprimer mon compte</p>
                    <p className="text-xs text-gray-400">Action irréversible</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalModif && (
        <ModalModification
          reservation={modalModif}
          onFermer={() => setModalModif(null)}
          onValider={validerModification}
        />
      )}

      {modalAnnul && (
        <ModalAnnulation
          reservation={modalAnnul}
          onFermer={() => setModalAnnul(null)}
          onConfirmer={confirmerAnnulation}
        />
      )}
    </Layout>
  )
}

import { useState, useEffect } from 'react'
import usePolling from '../../hooks/usePolling'
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
  const today = new Date().toISOString().split('T')[0]
  const bloque = today >= reservation.dateArrivee

  const totalActuel = reservation.total
  const prixNuitActuel = totalActuel / reservation.nuits
  const datePaiement = reservation.datePaiement ? new Date(reservation.datePaiement) : null
  const heuresDepuisPaiement = datePaiement ? (Date.now() - datePaiement.getTime()) / 3600000 : Infinity
  const dansFenetre2h = heuresDepuisPaiement <= 2

  const [chambres, setChambres] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('same')
  const [dateArrivee, setDateArrivee] = useState(reservation.dateArrivee)
  const [dateDepart, setDateDepart] = useState(reservation.dateDepart)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [telephone, setTelephone] = useState('')
  const [methode, setMethode] = useState('mtn')

  useEffect(() => {
    if (bloque) return
    api.get(`/hotels/${reservation.hotelId}/`)
      .then(res => setChambres(res.data.types_chambres || []))
      .catch(() => setChambres([]))
      .finally(() => setLoading(false))
  }, [])

  const nouvellesNuits = dateArrivee && dateDepart
    ? Math.max(1, Math.round((new Date(dateDepart) - new Date(dateArrivee)) / 86400000))
    : reservation.nuits

  const chambreChoisie = selectedId === 'same'
    ? { id: reservation.typeChambreId, nom: reservation.typeChambreNom, prix_nuit: prixNuitActuel }
    : chambres.find(c => c.id === selectedId)

  const prixNuitChoisi = chambreChoisie ? parseFloat(chambreChoisie.prix_nuit) : prixNuitActuel
  const nouveauTotal = prixNuitChoisi * nouvellesNuits
  const aChange = selectedId !== 'same' || dateArrivee !== reservation.dateArrivee || dateDepart !== reservation.dateDepart
  const estHausse = nouveauTotal > totalActuel
  const difference = Math.abs(nouveauTotal - totalActuel)
  const fraisModif = (!estHausse && !dansFenetre2h) ? Math.round(difference * reservation.tauxModification / 100) : 0
  const remboursement = estHausse ? 0 : (difference - fraisModif)
  const supplement = estHausse ? difference : 0

  const handleConfirmer = async () => {
    if (!aChange) { setErreur('Aucune modification détectée.'); return }
    if (!telephone.trim()) { setErreur('Veuillez indiquer votre numéro Mobile Money.'); return }
    setEnvoi(true)
    setErreur('')
    const payload = {
      numero_telephone: telephone.trim(),
      methode_paiement: methode,
    }
    if (selectedId !== 'same') payload.type_chambre_nouveau = selectedId
    if (dateArrivee !== reservation.dateArrivee || dateDepart !== reservation.dateDepart) {
      payload.date_arrivee_nouvelle = dateArrivee
      payload.date_depart_nouvelle = dateDepart
    }
    try {
      const res = await api.post(`/reservations/${reservation.id}/modifier/`, payload)
      onValider(res.data, chambreChoisie)
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Une erreur est survenue.')
    } finally {
      setEnvoi(false)
    }
  }

  if (bloque) {
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
              <p className="font-semibold text-red-700 text-sm">Modification bloquée</p>
              <p className="text-xs text-red-600 mt-1">Aucune modification n'est possible le jour d'arrivée ou après.</p>
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">Arrivée</label>
              <input type="date" value={dateArrivee} min={today}
                onChange={e => setDateArrivee(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">Départ</label>
              <input type="date" value={dateDepart} min={dateArrivee || today}
                onChange={e => setDateDepart(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
          {nouvellesNuits > 0 && (
            <p className="text-xs text-gray-400 -mt-3">{nouvellesNuits} nuit{nouvellesNuits > 1 ? 's' : ''} · Actuel : {reservation.nuits} nuit{reservation.nuits > 1 ? 's' : ''}</p>
          )}

          {/* Sélection chambre */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1.5">Chambre</label>
            {loading ? (
              <div className="w-full border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" /> Chargement...
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value === 'same' ? 'same' : parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white"
              >
                <option value="same">Garder — {reservation.typeChambreNom} ({prixNuitActuel.toLocaleString()} FCFA/nuit)</option>
                {chambres.filter(c => c.id !== reservation.typeChambreId).map(c => {
                  const prixC = parseFloat(c.prix_nuit) * nouvellesNuits
                  const tag = prixC < totalActuel ? '↓ Baisse' : prixC > totalActuel ? '↑ Hausse' : '= Identique'
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nom} — {parseFloat(c.prix_nuit).toLocaleString()} FCFA/nuit ({tag})
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          {/* Règle 2h */}
          {aChange && difference > 0 && !estHausse && (
            <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${dansFenetre2h ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
              <Info size={14} className="shrink-0 mt-0.5" />
              {dansFenetre2h
                ? 'Paiement effectué il y a moins de 2h — différence remboursée intégralement, sans frais.'
                : `Après le délai de 2h : frais de modification de ${reservation.tauxModification}% sur la différence.`}
            </div>
          )}

          {/* Récapitulatif financier — Baisse */}
          {aChange && difference > 0 && !estHausse && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-3">Remboursement estimé</p>
              <div className="flex justify-between text-gray-600">
                <span>Montant actuel</span><span>{totalActuel.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Nouveau montant ({nouvellesNuits} nuit{nouvellesNuits > 1 ? 's' : ''})</span>
                <span>{nouveauTotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600 border-t border-amber-100 pt-2">
                <span>Différence</span><span>{difference.toLocaleString()} FCFA</span>
              </div>
              {!dansFenetre2h && fraisModif > 0 && (
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>Frais de modification ({reservation.tauxModification}%)</span>
                  <span>−{fraisModif.toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="flex justify-between border-t border-amber-200 pt-2 font-bold">
                <span className="text-gray-800">Vous serez remboursé</span>
                <span className="text-green-700">{remboursement.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {/* Récapitulatif financier — Hausse */}
          {aChange && difference > 0 && estHausse && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-3">Supplément à payer</p>
              <div className="flex justify-between text-gray-600">
                <span>Montant déjà payé</span><span>{totalActuel.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Nouveau montant ({nouvellesNuits} nuit{nouvellesNuits > 1 ? 's' : ''})</span>
                <span>{nouveauTotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2 font-bold">
                <span className="text-gray-800">Supplément (Mobile Money)</span>
                <span className="text-blue-700">{supplement.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {/* Numéro Mobile Money */}
          {aChange && (
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">
                {estHausse && difference > 0 ? 'Numéro Mobile Money — prélèvement du supplément' : 'Numéro Mobile Money — remboursement'}
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="flex gap-2">
                <select value={methode} onChange={e => setMethode(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white">
                  <option value="mtn">MTN</option>
                  <option value="moov">Moov</option>
                </select>
                <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                  placeholder="+229 XX XX XX XX"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
          )}

          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" /> {erreur}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onFermer}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button
              disabled={!aChange || envoi}
              onClick={handleConfirmer}
              className={`flex-1 ${estHausse && difference > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2`}>
              {envoi && <Loader2 size={14} className="animate-spin" />}
              {!aChange ? 'Aucune modification'
                : estHausse && difference > 0 ? `Confirmer (+${supplement.toLocaleString()} FCFA)`
                : difference > 0 ? `Confirmer (rembours. ${remboursement.toLocaleString()} FCFA)`
                : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalAnnulation({ reservation, onFermer, onConfirmer }) {
  const today = new Date().toISOString().split('T')[0]
  const bloque = today >= reservation.dateArrivee

  const datePaiement = reservation.datePaiement ? new Date(reservation.datePaiement) : null
  const heuresDepuisPaiement = datePaiement ? (Date.now() - datePaiement.getTime()) / 3600000 : Infinity
  const dansFenetre2h = heuresDepuisPaiement <= 2

  const fraisEstime = dansFenetre2h ? 0 : Math.round(reservation.total * reservation.tauxAnnulation / 100)
  const remboursementEstime = reservation.total - fraisEstime

  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [telephone, setTelephone] = useState('')
  const [methode, setMethode] = useState('mtn')
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleConfirmer = async () => {
    if (!motif.trim()) { setErreur('Veuillez indiquer un motif.'); return }
    if (remboursementEstime > 0 && !telephone.trim()) { setErreur('Veuillez indiquer votre numéro Mobile Money pour recevoir le remboursement.'); return }
    setEnvoi(true)
    setErreur('')
    try {
      const res = await api.post(`/reservations/${reservation.id}/annuler/`, {
        motif,
        numero_telephone: telephone.trim(),
        methode_paiement: methode,
      })
      const rembourse = parseFloat(res.data.montant_rembourse)
      onConfirmer(reservation.id, rembourse)
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Une erreur est survenue.')
    } finally {
      setEnvoi(false)
    }
  }

  if (bloque) {
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
              <p className="font-semibold text-red-700 text-sm">Annulation bloquée</p>
              <p className="text-xs text-red-600 mt-1">
                Aucune annulation n'est possible le jour d'arrivée ou après ({formatDate(reservation.dateArrivee)}).
              </p>
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
          {/* Résumé */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900">{reservation.hotelNom}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{reservation.id}</p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDate(reservation.dateArrivee)} → {formatDate(reservation.dateDepart)} · {reservation.nuits} nuit{reservation.nuits > 1 ? 's' : ''}
            </p>
          </div>

          {/* Règle applicable */}
          <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${dansFenetre2h ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
            <Info size={14} className="shrink-0 mt-0.5" />
            {dansFenetre2h
              ? 'Paiement effectué il y a moins de 2h — remboursement intégral, aucun frais.'
              : `Après les 2h — frais d'annulation de ${reservation.tauxAnnulation}% retenus par l'hôtel.`}
          </div>

          {/* Détail remboursement */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Remboursement estimé</p>
            <div className="flex justify-between text-gray-700">
              <span>Montant total payé</span>
              <span className="font-medium">{reservation.total.toLocaleString()} FCFA</span>
            </div>
            {!dansFenetre2h && (
              <div className="flex justify-between text-gray-400 text-xs">
                <span>Frais d'annulation ({reservation.tauxAnnulation}%)</span>
                <span>−{fraisEstime.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-3 font-bold">
              <span className="text-gray-900">Vous recevez</span>
              <span className="text-green-600 text-base">{remboursementEstime.toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Numéro Mobile Money pour remboursement */}
          {remboursementEstime > 0 && (
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">
                Numéro Mobile Money — remboursement <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <select value={methode} onChange={e => setMethode(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white">
                  <option value="mtn">MTN</option>
                  <option value="moov">Moov</option>
                </select>
                <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                  placeholder="+229 XX XX XX XX"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Le remboursement de {remboursementEstime.toLocaleString()} FCFA sera versé sur ce numéro.</p>
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1.5">Motif de l'annulation <span className="text-red-400">*</span></label>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              rows={2}
              placeholder="Précisez la raison de votre annulation..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" /> {erreur}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-center gap-2">
            <Shield size={14} className="shrink-0" />
            Remboursement sur votre Mobile Money sous 24 à 72h ouvrées.
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onFermer}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Conserver
            </button>
            <button
              onClick={handleConfirmer}
              disabled={envoi || !motif.trim()}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {envoi && <Loader2 size={14} className="animate-spin" />}
              Annuler la réservation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mots interdits détectés côté client avant soumission
const MOTS_INTERDITS = [
  // Français
  'merde', 'putain', 'connard', 'connasse', 'salope', 'enculé', 'encule', 'fdp', 'nique',
  'niquer', 'conne', 'con', 'pute', 'bâtard', 'batard', 'fils de pute', 'va te faire',
  'ta gueule', 'ferme ta gueule', 'imbécile', 'idiot', 'crétin', 'abruti', 'ntm', 'pd',
  // Fon / Yoruba (termes vulgaires courants)
  'ashawo', 'werey', 'oloshi', 'ode', 'kpata', 'wo wo', 'wô wô', 'ayanfe', 'olo',
]

function contientMotInterdit(texte) {
  if (!texte) return false
  const t = texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return MOTS_INTERDITS.some(mot => {
    const m = mot.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return t.includes(m)
  })
}

function formatCountdown(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function CarteReservation({ reservation, onConfirmerSejour, onModifier, onAnnuler, onNotif }) {
  const [qrOuvert, setQrOuvert] = useState(false)
  // Avis
  const [localAvisDisponible, setLocalAvisDisponible] = useState(reservation.avisDisponible || false)
  const [avisModalOuvert, setAvisModalOuvert] = useState(false)
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [explication, setExplication] = useState('')
  const [etapeSignalement, setEtapeSignalement] = useState(false)
  const [avisEnvoye, setAvisEnvoye] = useState(reservation.aSoumisAvis || false)
  const [signalementEnvoye, setSignalementEnvoye] = useState(false)
  const [avisEnvoi, setAvisEnvoi] = useState(false)
  const [avisErreur, setAvisErreur] = useState('')
  const [secondesRestantes, setSecondesRestantes] = useState(null)

  // Countdown post-séjour
  useEffect(() => {
    if (reservation.statut !== 'terminee' || localAvisDisponible) return
    const depart = new Date(reservation.dateDepart + 'T00:00:00')
    const dureeSecondes = (reservation.nuits || 1) * 24 * 3600
    const calculer = () => Math.max(0, Math.floor(dureeSecondes - (Date.now() - depart.getTime()) / 1000))
    const initial = calculer()
    setSecondesRestantes(initial)
    if (initial === 0) { setLocalAvisDisponible(true); return }
    const timer = setInterval(() => {
      const restantes = calculer()
      setSecondesRestantes(restantes)
      if (restantes <= 0) { clearInterval(timer); setLocalAvisDisponible(true) }
    }, 1000)
    return () => clearInterval(timer)
  }, [reservation.id, localAvisDisponible])

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

        {/* Alerte jour d'arrivée */}
        {peutAgir && dans24h && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs border bg-orange-50 text-orange-700 border-orange-100 flex items-center gap-1.5">
            <AlertCircle size={12} />
            Modification et annulation bloquées le jour d'arrivée.
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

          {/* Zone avis post-séjour */}
          {reservation.statut === 'terminee' && !avisEnvoye && !localAvisDisponible && secondesRestantes !== null && (
            <div className="w-full flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <Star size={12} className="text-gray-300 shrink-0" />
              <span className="text-xs text-gray-400">Avis disponible dans</span>
              <span className="font-mono text-xs font-bold text-blue-600 tracking-widest">
                {formatCountdown(secondesRestantes)}
              </span>
            </div>
          )}
          {reservation.statut === 'terminee' && !avisEnvoye && localAvisDisponible && (
            <button onClick={() => setAvisModalOuvert(true)}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">
              <Star size={12} className="fill-white" /> Donner votre avis
            </button>
          )}
          {reservation.statut === 'terminee' && avisEnvoye && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              {[...Array(note || 1)].map((_, i) => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
              <span className="ml-1 text-gray-400">Avis envoyé</span>
            </div>
          )}
          {reservation.statut === 'terminee' && signalementEnvoye && (
            <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1.5">
              <AlertCircle size={11} className="shrink-0" />
              <span>Commentaire en cours de modération</span>
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

        {/* Modale avis */}
        {avisModalOuvert && !avisEnvoye && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-base">
                  {etapeSignalement ? 'Précisez votre commentaire' : `Votre avis — ${reservation.hotelNom}`}
                </h3>
                <button onClick={() => { setAvisModalOuvert(false); setEtapeSignalement(false); setAvisErreur('') }}
                  className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
              </div>

              {!etapeSignalement ? (
                <>
                  {/* Sélection note */}
                  <p className="text-xs text-gray-500 mb-2">Votre note globale</p>
                  <div className="flex gap-2 mb-4 justify-center">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setNote(n)} className="transition-transform hover:scale-110">
                        <Star size={32} className={n <= note ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      </button>
                    ))}
                  </div>
                  <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={4}
                    placeholder="Partagez votre expérience (service, propreté, confort...)..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 resize-none mb-3" />
                  {avisErreur && <p className="text-red-500 text-xs mb-2">{avisErreur}</p>}
                  <button
                    onClick={async () => {
                      if (note === 0) { setAvisErreur('Veuillez choisir une note.'); return }
                      if (contientMotInterdit(commentaire)) {
                        setEtapeSignalement(true)
                        setAvisErreur('')
                        return
                      }
                      setAvisEnvoi(true); setAvisErreur('')
                      try {
                        await api.post('/avis/', {
                          hotel: reservation.hotelId,
                          reservation: reservation.reservationPk,
                          note,
                          commentaire,
                        })
                        setAvisEnvoye(true); setAvisModalOuvert(false)
                      } catch (err) {
                        const data = err.response?.data
                        const msg = data?.non_field_errors?.[0] || data?.detail || Object.values(data || {})[0] || 'Erreur lors de la publication.'
                        setAvisErreur(typeof msg === 'string' ? msg : JSON.stringify(msg))
                      } finally { setAvisEnvoi(false) }
                    }}
                    disabled={note === 0 || avisEnvoi}
                    className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    {avisEnvoi ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} className="fill-white" />}
                    {avisEnvoi ? 'Publication...' : 'Publier mon avis'}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 text-xs text-orange-700">
                    Votre commentaire contient des termes inappropriés. Merci de nous expliquer ce qui s'est passé pour que nous puissions traiter votre retour.
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Votre explication</p>
                  <textarea value={explication} onChange={e => setExplication(e.target.value)} rows={4}
                    placeholder="Décrivez la situation qui vous a conduit à utiliser ces termes..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 resize-none mb-3" />
                  {avisErreur && <p className="text-red-500 text-xs mb-2">{avisErreur}</p>}
                  <button
                    onClick={async () => {
                      if (!explication.trim()) { setAvisErreur('Veuillez fournir une explication.'); return }
                      setAvisEnvoi(true); setAvisErreur('')
                      try {
                        await api.post('/signalements/', {
                          reservation: reservation.reservationPk,
                          hotel: reservation.hotelId,
                          avis_initial: commentaire,
                          explication,
                        })
                        setSignalementEnvoye(true); setAvisModalOuvert(false)
                        onNotif?.('Votre commentaire a été transmis pour modération. Merci !')
                      } catch (err) {
                        const data = err.response?.data
                        const msg = data?.non_field_errors?.[0] || data?.detail || Object.values(data || {})[0] || 'Erreur lors de l\'envoi.'
                        setAvisErreur(typeof msg === 'string' ? msg : JSON.stringify(msg))
                      } finally { setAvisEnvoi(false) }
                    }}
                    disabled={!explication.trim() || avisEnvoi}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    {avisEnvoi ? <Loader2 size={14} className="animate-spin" /> : null}
                    {avisEnvoi ? 'Envoi...' : 'Envoyer mon explication'}
                  </button>
                </>
              )}
            </div>
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
  usePolling(() => {
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
          typeChambreId: r.type_chambre_id,
          typeChambreNom: r.type_chambre_nom,
          chambres: [{ type: r.type_chambre_nom, quantite: 1, prix: parseFloat(r.prix_total) / (r.nb_nuits || 1) }],
          total: parseFloat(r.prix_total),
          statut: r.statut,
          tauxAnnulation: r.hotel_taux_annulation ?? 20,
          tauxModification: r.hotel_taux_modification ?? 10,
          datePaiement: r.date_paiement || null,
          avisDisponible: r.avis_disponible || false,
          aSoumisAvis: r.a_soumis_avis || false,
        }))
        setReservations(data)
      })
      .catch(() => setReservations([]))
      .finally(() => setChargementRes(false))
  }, 30000)

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

  const validerModification = (apiData, nouvelleChambres) => {
    setReservations(prev => prev.map(r => {
      if (r.id !== modalModif.id) return r
      return {
        ...r,
        total: parseFloat(apiData.prix_nouveau),
        typeChambreNom: nouvelleChambres.nom,
        typeChambreId: nouvelleChambres.id,
        chambres: [{ type: nouvelleChambres.nom, quantite: 1, prix: parseFloat(nouvelleChambres.prix_nuit) }],
      }
    }))
    const montant = parseFloat(apiData.montant_rembourse || 0)
    const supplement = parseFloat(apiData.montant_supplementaire || 0)
    if (apiData.sens === 'hausse') {
      afficherNotif(`Modification confirmée. Supplément de ${Math.round(supplement).toLocaleString()} FCFA à régler à l'hôtel à l'arrivée.`)
    } else {
      afficherNotif(`Modification confirmée. Remboursement de ${Math.round(montant).toLocaleString()} FCFA sous 24-72h.`)
    }
    setModalModif(null)
  }

  const confirmerAnnulation = (id, remboursement) => {
    setReservations(prev => prev.map(r =>
      r.id === id ? { ...r, statut: 'annulee' } : r
    ))
    afficherNotif(`Réservation annulée. Remboursement de ${Math.round(remboursement).toLocaleString()} FCFA sous 24-72h.`)
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
          <div className={`fixed top-4 right-4 z-50 ${notif.type === 'erreur' ? 'bg-red-500' : 'bg-green-600'} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm`}>
            {notif.type === 'erreur' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} {notif.msg}
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
                    onNotif={afficherNotif}
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

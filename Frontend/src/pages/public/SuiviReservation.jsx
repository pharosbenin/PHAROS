import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  Search, Calendar, MapPin, QrCode, Clock, CheckCircle, XCircle, RotateCcw,
  AlertCircle, Loader2, Shield, Info, Download, Building2,
} from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'

const STATUTS = {
  en_attente: { label: 'En attente', couleur: 'bg-gray-100 text-gray-400', icon: Clock },
  payee: { label: 'Payée', couleur: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  confirmee: { label: 'Confirmée', couleur: 'bg-green-100 text-green-700', icon: CheckCircle },
  en_cours: { label: 'En cours', couleur: 'bg-indigo-100 text-indigo-700', icon: Clock },
  confirme_client: { label: 'En attente hôtel', couleur: 'bg-indigo-100 text-indigo-700', icon: Clock },
  confirme_hotel: { label: 'Hôtel confirmé', couleur: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  terminee: { label: 'Terminée', couleur: 'bg-gray-100 text-gray-600', icon: CheckCircle },
  annulee: { label: 'Annulée', couleur: 'bg-red-100 text-red-500', icon: XCircle },
  remboursee: { label: 'Remboursée', couleur: 'bg-teal-100 text-teal-700', icon: RotateCcw },
}

function ModalAnnulationInvite({ reservation, email, onFermer, onConfirmer }) {
  const today = new Date().toISOString().split('T')[0]
  const bloque = today >= reservation.date_arrivee

  const datePaiement = reservation.paiement?.date_paiement ? new Date(reservation.paiement.date_paiement) : null
  const heuresDepuisPaiement = datePaiement ? (Date.now() - datePaiement.getTime()) / 3600000 : Infinity
  const dansFenetre2h = heuresDepuisPaiement <= 2
  const total = parseFloat(reservation.prix_total)
  const fraisEstime = dansFenetre2h ? 0 : Math.round(total * (reservation.hotel_taux_annulation ?? 20) / 100)
  const remboursementEstime = total - fraisEstime

  const [motif, setMotif] = useState('')
  const [telephone, setTelephone] = useState('')
  const [methode, setMethode] = useState('mtn')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const handleConfirmer = async () => {
    if (!motif.trim()) { setErreur('Veuillez indiquer un motif.'); return }
    if (remboursementEstime > 0 && (!telephone.trim() || telephone.length !== 10 || !telephone.startsWith('01'))) {
      setErreur('Numéro Mobile Money invalide. 10 chiffres requis, commençant par 01.'); return
    }
    setEnvoi(true)
    setErreur('')
    try {
      const res = await api.post(`/reservations/${reservation.numero}/annuler/`, {
        motif,
        numero_telephone: telephone.trim(),
        methode_paiement: methode,
        email_client: email,
      })
      onConfirmer(parseFloat(res.data.montant_rembourse))
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
          <h2 className="font-bold text-gray-900 mb-3">Annulation impossible</h2>
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            Aucune annulation n'est possible le jour d'arrivée ou après.
          </p>
          <button onClick={onFermer} className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Annuler la réservation</h2>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${dansFenetre2h ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
            <Info size={14} className="shrink-0 mt-0.5" />
            {dansFenetre2h
              ? 'Paiement effectué il y a moins de 2h — remboursement intégral, aucun frais.'
              : `Après les 2h — frais d'annulation de ${reservation.hotel_taux_annulation ?? 20}% retenus par l'hôtel.`}
          </div>

          <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Montant total payé</span><span className="font-medium">{total.toLocaleString()} FCFA</span>
            </div>
            {!dansFenetre2h && (
              <div className="flex justify-between text-gray-400 text-xs">
                <span>Frais d'annulation</span><span>−{fraisEstime.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-3 font-bold">
              <span className="text-gray-900">Vous recevez</span>
              <span className="text-green-600 text-base">{remboursementEstime.toLocaleString()} FCFA</span>
            </div>
          </div>

          {remboursementEstime > 0 && (
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">Numéro Mobile Money — remboursement *</label>
              <div className="flex gap-2">
                <select value={methode} onChange={e => setMethode(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white">
                  <option value="mtn">MTN</option>
                  <option value="moov">Moov</option>
                </select>
                <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="01XXXXXXXX"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1.5">Motif de l'annulation *</label>
            <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={2}
              placeholder="Précisez la raison de votre annulation..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
          </div>

          {erreur && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl p-3">{erreur}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onFermer}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50">
              Conserver
            </button>
            <button onClick={handleConfirmer} disabled={envoi || !motif.trim()}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              {envoi && <Loader2 size={14} className="animate-spin" />}
              Annuler la réservation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuiviReservation() {
  const { state } = useLocation()
  const [numero, setNumero] = useState(state?.numero || '')
  const [email, setEmail] = useState(state?.email || '')
  const [reservation, setReservation] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [modalAnnul, setModalAnnul] = useState(false)
  const [notif, setNotif] = useState('')
  const [confirmEnvoi, setConfirmEnvoi] = useState(false)

  const lancerRecherche = async (num, mail) => {
    if (!num.trim() || !mail.trim()) { setErreur('Renseignez le numéro de réservation et l\'email utilisés.'); return }
    setChargement(true)
    setErreur('')
    setReservation(null)
    try {
      const res = await api.get(`/reservations/${num.trim()}/`, { params: { email_client: mail.trim() } })
      setReservation(res.data)
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Réservation introuvable. Vérifiez le numéro et l\'email.')
    } finally {
      setChargement(false)
    }
  }

  // Préremplissage automatique depuis la page de confirmation post-paiement
  useEffect(() => {
    if (state?.numero && state?.email) lancerRecherche(state.numero, state.email)
  }, [])

  const rechercher = (e) => {
    e.preventDefault()
    lancerRecherche(numero, email)
  }

  const confirmerSejour = async () => {
    setConfirmEnvoi(true)
    try {
      const res = await api.post(`/reservations/${reservation.numero}/confirmer-sejour/`, { email_client: email.trim() })
      setReservation(r => ({ ...r, statut: res.data.statut }))
      setNotif(res.data.message)
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Erreur lors de la confirmation.')
    } finally {
      setConfirmEnvoi(false)
    }
  }

  const statutInfo = reservation ? (STATUTS[reservation.statut] ?? { label: reservation.statut, couleur: 'bg-gray-100 text-gray-600', icon: Info }) : null
  const IconeStatut = statutInfo?.icon

  const now = new Date()
  const depart = reservation ? new Date(reservation.date_depart) : null
  const peutConfirmer = depart ? now >= new Date(depart.getTime() - 5 * 3600 * 1000) : false
  const peutAgir = reservation && ['payee', 'confirmee'].includes(reservation.statut)
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {notif && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm">
            <CheckCircle size={16} /> {notif}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Gérer ma réservation</h1>
          <p className="text-gray-500 text-sm">
            Retrouvez votre réservation sans compte, avec votre numéro de réservation et votre email.
          </p>
        </div>

        {/* Formulaire de recherche */}
        <form onSubmit={rechercher} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Numéro de réservation</label>
            <input type="text" value={numero} onChange={e => setNumero(e.target.value)}
              placeholder="ex: a1b2c3d4-..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Adresse email utilisée pour la réservation</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
          </div>
          {erreur && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{erreur}</p>
            </div>
          )}
          <button type="submit" disabled={chargement}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
            {chargement ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Retrouver ma réservation
          </button>
        </form>

        {/* Résultat */}
        {reservation && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Building2 size={16} className="text-blue-500" /> {reservation.hotel_nom}
                  </h2>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {reservation.hotel_ville}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 shrink-0 ${statutInfo.couleur}`}>
                  <IconeStatut size={11} /> {statutInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} className="text-blue-400" />
                {formatDate(reservation.date_arrivee)} → {formatDate(reservation.date_depart)}
                <span className="text-blue-600 font-medium">· {reservation.nb_nuits} nuit{reservation.nb_nuits > 1 ? 's' : ''}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{reservation.type_chambre_nom}</p>
              <p className="font-bold text-blue-600 mt-2">{parseFloat(reservation.prix_total).toLocaleString()} FCFA</p>
            </div>

            {/* QR Code */}
            {['payee', 'confirmee', 'en_cours'].includes(reservation.statut) && reservation.qrcode && (
              <div className="p-5 border-b border-gray-50 flex items-center gap-4">
                <div className="border-2 border-gray-200 rounded-lg p-2 bg-white">
                  <QRCodeSVG value={String(reservation.numero)} size={72} level="M" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5"><QrCode size={12} /> QR Code de check-in</p>
                  <p className="text-xs text-gray-400 mt-0.5">Présentez ce code à la réception à l'arrivée.</p>
                </div>
              </div>
            )}

            {/* Escrow */}
            {['payee', 'confirmee', 'en_cours'].includes(reservation.statut) && (
              <div className="p-5 border-b border-gray-50">
                <div className={`px-3 py-2 rounded-xl text-xs border flex items-start gap-1.5 ${peutConfirmer ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                  <Shield size={11} className="shrink-0 mt-0.5" />
                  {peutConfirmer
                    ? "Séjour bientôt terminé. Confirmez pour déclencher le transfert des fonds à l'hôtel."
                    : `Fonds sécurisés par PHAROS. Confirmation possible à partir du ${formatDate(reservation.date_depart)}.`}
                </div>
              </div>
            )}
            {reservation.statut === 'confirme_client' && (
              <div className="p-5 border-b border-gray-50">
                <div className="px-3 py-2 rounded-xl text-xs border bg-indigo-50 text-indigo-700 border-indigo-100 flex items-start gap-1.5">
                  <CheckCircle size={11} className="shrink-0 mt-0.5" />
                  Votre confirmation a été enregistrée. En attente de la confirmation de l'hôtel.
                </div>
              </div>
            )}
            {reservation.statut === 'confirme_hotel' && (
              <div className="p-5 border-b border-gray-50">
                <div className="px-3 py-2 rounded-xl text-xs border bg-amber-50 text-amber-700 border-amber-100 flex items-start gap-1.5">
                  <AlertCircle size={11} className="shrink-0 mt-0.5" />
                  L'hôtel a confirmé votre séjour. Confirmez à votre tour pour libérer les fonds.
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-5 flex flex-wrap gap-2">
              {((['payee', 'confirmee', 'en_cours'].includes(reservation.statut) && peutConfirmer) || reservation.statut === 'confirme_hotel') && (
                <button onClick={confirmerSejour} disabled={confirmEnvoi}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-bold px-4 py-2 rounded-lg">
                  {confirmEnvoi ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  {reservation.statut === 'confirme_hotel' ? 'Confirmer — libérer les fonds' : 'Confirmer mon séjour'}
                </button>
              )}
              {peutAgir && (
                <button onClick={() => setModalAnnul(true)}
                  className="flex items-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium px-4 py-2 rounded-lg">
                  <RotateCcw size={12} /> Annuler
                </button>
              )}
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium px-4 py-2 rounded-lg">
                <Download size={12} /> Télécharger le justificatif
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Vous avez un compte ? <a href="/connexion" className="text-blue-600 hover:underline">Connectez-vous</a> pour voir toutes vos réservations au même endroit.
        </p>
      </div>

      {modalAnnul && reservation && (
        <ModalAnnulationInvite
          reservation={reservation}
          email={email.trim()}
          onFermer={() => setModalAnnul(false)}
          onConfirmer={(montant) => {
            setReservation(r => ({ ...r, statut: 'annulee' }))
            setNotif(`Réservation annulée. Remboursement de ${Math.round(montant).toLocaleString()} FCFA sous 24-72h.`)
            setModalAnnul(false)
          }}
        />
      )}
    </Layout>
  )
}

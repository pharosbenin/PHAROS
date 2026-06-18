import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  CheckCircle, XCircle, Clock, Calendar, Users, Home, MapPin,
  QrCode, Shield, Loader2, AlertCircle, Download, RotateCcw,
} from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'

const STATUTS = {
  en_attente: { label: 'En attente de paiement', couleur: 'bg-gray-100 text-gray-500', icon: Clock },
  payee: { label: 'Payée — check-in en attente', couleur: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  confirmee: { label: 'Confirmée', couleur: 'bg-green-100 text-green-700', icon: CheckCircle },
  en_cours: { label: 'Séjour en cours', couleur: 'bg-indigo-100 text-indigo-700', icon: Clock },
  confirme_client: { label: 'Confirmation client faite', couleur: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  confirme_hotel: { label: 'Confirmation hôtel faite', couleur: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  terminee: { label: 'Séjour terminé', couleur: 'bg-gray-100 text-gray-600', icon: CheckCircle },
  annulee: { label: 'Annulée', couleur: 'bg-red-100 text-red-500', icon: XCircle },
  remboursee: { label: 'Remboursée', couleur: 'bg-teal-100 text-teal-700', icon: RotateCcw },
}

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RecuReservation() {
  const { code } = useParams()
  const [reservation, setReservation] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!code) { setErreur('Code QR invalide.'); setChargement(false); return }
    api.get(`/recu-qr/${code}/`)
      .then(res => setReservation(res.data))
      .catch(() => setErreur('QR code invalide ou réservation introuvable.'))
      .finally(() => setChargement(false))
  }, [code])

  if (chargement) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      </Layout>
    )
  }

  if (erreur || !reservation) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">QR Code invalide</h2>
          <p className="text-gray-500 text-sm mb-6">{erreur || 'Ce QR code ne correspond à aucune réservation.'}</p>
          <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm">
            Retour à l'accueil
          </Link>
        </div>
      </Layout>
    )
  }

  const statutInfo = STATUTS[reservation.statut] ?? { label: reservation.statut, couleur: 'bg-gray-100 text-gray-600', icon: Clock }
  const IconeStatut = statutInfo.icon
  const total = parseFloat(reservation.prix_total || 0)
  const qrUrl = `${window.location.origin}/recu/${code}`

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">

        {/* En-tête */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Reçu de réservation</h1>

          {/* Numéro complet — visible uniquement après scan du QR code */}
          <div className="bg-gray-900 rounded-2xl px-5 py-4 inline-block text-left mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1.5">N° de réservation</p>
            <p className="text-white font-mono font-bold text-sm break-all leading-relaxed">
              {reservation.numero}
            </p>
          </div>
        </div>

        {/* Statut */}
        <div className="flex justify-center mb-6">
          <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statutInfo.couleur}`}>
            <IconeStatut size={15} />
            {statutInfo.label}
          </span>
        </div>

        {/* Hôtel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Home size={16} className="text-blue-500" /> Hôtel
          </h2>
          <p className="font-bold text-gray-800">{reservation.hotel_nom}</p>
          {reservation.hotel_ville && (
            <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {reservation.hotel_ville}
            </p>
          )}
        </div>

        {/* Client */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} className="text-blue-500" /> Client
          </h2>
          <p className="font-medium text-gray-800">{reservation.prenom_client} {reservation.nom_client}</p>
          <p className="text-sm text-gray-500">{reservation.email_client}</p>
          {reservation.telephone_client && (
            <p className="text-sm text-gray-500">{reservation.telephone_client}</p>
          )}
        </div>

        {/* Séjour */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" /> Séjour
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Chambre</span>
              <span className="font-medium text-gray-800">{reservation.type_chambre_nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Arrivée</span>
              <span className="font-medium text-gray-800">{formatDate(reservation.date_arrivee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Départ</span>
              <span className="font-medium text-gray-800">{formatDate(reservation.date_depart)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Durée</span>
              <span className="font-medium text-blue-600">{reservation.nb_nuits} nuit{reservation.nb_nuits > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Voyageurs</span>
              <span className="font-medium text-gray-800">{reservation.nb_adultes} adulte{reservation.nb_adultes > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 mt-2">
              <span className="font-bold text-gray-900">Total payé</span>
              <span className="font-bold text-green-600 text-base">{total.toLocaleString()} FCFA</span>
            </div>
          </div>

          {reservation.paiement && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
              <p>Méthode : <span className="font-medium text-gray-600 capitalize">{reservation.paiement.methode}</span></p>
              {reservation.paiement.date_paiement && (
                <p>Payé le : <span className="font-medium text-gray-600">
                  {new Date(reservation.paiement.date_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span></p>
              )}
              {reservation.paiement.reference_externe && (
                <p className="font-mono">Réf : {reservation.paiement.reference_externe.slice(0, 12).toUpperCase()}</p>
              )}
            </div>
          )}
        </div>

        {/* QR code */}
        {reservation.qrcode && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode size={16} className="text-gray-600" />
              <h2 className="font-semibold text-gray-900 text-sm">QR Code de check-in</h2>
            </div>
            <div className="flex justify-center mb-2">
              <div className="border-2 border-gray-200 rounded-xl p-3 bg-white inline-block">
                <QRCodeSVG value={qrUrl} size={120} level="H" />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {reservation.qrcode.est_utilise
                ? <span className="text-green-600 font-medium">✓ Check-in effectué</span>
                : 'Présentez ce code à la réception à votre arrivée.'}
            </p>
          </div>
        )}

        {/* Sécurité escrow */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
          <p className="font-semibold mb-1 flex items-center gap-1.5"><Shield size={14} /> Paiement sécurisé</p>
          <p className="text-xs text-blue-600">
            Les fonds sont conservés par PHAROS et transférés à l'hôtel uniquement après la fin de votre séjour.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm"
          >
            <Download size={16} /> Télécharger le justificatif
          </button>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm"
          >
            Retour à l'accueil
          </Link>
        </div>

      </div>
    </Layout>
  )
}

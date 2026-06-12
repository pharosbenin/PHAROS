import { useParams, useLocation, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle, Download, QrCode, MapPin, Phone, Calendar, Users, Home } from 'lucide-react'
import Layout from '../../components/common/Layout'

export default function Confirmation() {
  const { reservationId } = useParams()
  const { state } = useLocation()

  // Nouveau format : { reservation (objet backend), methodeLabel }
  const res = state?.reservation
  const methodeLabel = state?.methodeLabel || state?.methode || 'Mobile Money'
  const transactionId = state?.transactionId

  // Champs normalisés — supporte aussi l'ancien format pour la rétrocompatibilité
  const numReservation = res?.numero || reservationId || 'RES-PHAROS'
  const hotelNom = res?.hotel_nom || state?.hotelNom || 'Hôtel PHAROS'
  const hotelVille = res?.hotel_ville || ''
  const emailClient = res?.email_client || state?.clientInfo?.email || ''
  const prenomClient = res?.prenom_client || state?.clientInfo?.prenom || ''
  const nomClient = res?.nom_client || state?.clientInfo?.nom || ''
  const dateArrivee = res?.date_arrivee || state?.dateArrivee || ''
  const dateDepart = res?.date_depart || state?.dateDepart || ''
  const nuits = res?.nb_nuits || state?.nuits || 1
  const voyageurs = res?.nb_adultes || state?.voyageurs || 1
  const total = parseFloat(res?.prix_total || state?.total || 0)
  const chambreNom = res?.type_chambre_nom || state?.panier?.[0]?.type || 'Chambre'
  const qrCodeValue = res?.qrcode?.code || numReservation

  const dateReservation = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* En-tête succès */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={44} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Réservation confirmée !</h1>
          {emailClient && (
            <p className="text-gray-500 text-sm">
              Un email de confirmation a été envoyé à <span className="text-blue-600 font-medium">{emailClient}</span>
            </p>
          )}
          <div className="inline-flex items-center gap-2 mt-3 bg-gray-100 rounded-full px-4 py-1.5">
            <span className="text-xs text-gray-500">Numéro de réservation</span>
            <span className="text-sm font-bold text-gray-900 tracking-wide font-mono">
              {String(numReservation).slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCode size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-900">QR Code de check-in</h2>
          </div>
          <div className="flex justify-center mb-3">
            <div className="border-2 border-gray-200 rounded-xl p-3 bg-white inline-block">
              <QRCodeSVG value={String(qrCodeValue)} size={140} level="H" />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Présentez ce QR code à la réception de l'hôtel lors de votre arrivée.<br />
            Code : <strong className="font-mono">{String(qrCodeValue).slice(0, 8).toUpperCase()}</strong>
          </p>
        </div>

        {/* Détails de l'hôtel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Informations hôtel</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Home size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-800">{hotelNom}</p>
                {hotelVille && <p className="text-gray-500 text-xs">{hotelVille}</p>}
              </div>
            </div>
            {(prenomClient || nomClient) && (
              <div className="flex items-start gap-3">
                <Users size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-gray-600">{prenomClient} {nomClient}</p>
              </div>
            )}
          </div>
        </div>

        {/* Détails du séjour */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Détails du séjour</h2>
          <div className="space-y-3 text-sm">
            {dateArrivee && (
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-800">Arrivée :</span> {formatDate(dateArrivee)}
                  </p>
                  {dateDepart && (
                    <p className="text-gray-600 mt-1">
                      <span className="font-medium text-gray-800">Départ :</span> {formatDate(dateDepart)}
                    </p>
                  )}
                  <p className="text-blue-600 font-medium mt-1">
                    {nuits} nuit{nuits > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users size={16} className="text-blue-500 shrink-0" />
              <p className="text-gray-600">{voyageurs} voyageur{voyageurs > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Chambres */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{chambreNom} × {nuits} nuit{nuits > 1 ? 's' : ''}</span>
              <span className="font-medium text-gray-800">{total.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-bold text-gray-900">Total payé</span>
              <span className="font-bold text-green-600 text-lg">{total.toLocaleString()} FCFA</span>
            </div>
            <p className="text-xs text-gray-400">
              Payé via {methodeLabel} · Fonds sécurisés par Escrow PHAROS
            </p>
            {transactionId && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Réf. FedaPay : <span className="font-semibold">{transactionId}</span>
              </p>
            )}
          </div>
        </div>

        {/* Notice Escrow */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
          <p className="font-semibold mb-1">Votre paiement est sécurisé</p>
          <p className="text-xs text-blue-600">
            Les fonds sont conservés par PHAROS et transférés à l'hôtel uniquement après la fin de votre séjour.
            En cas de problème, vous pouvez demander un remboursement.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            <Download size={18} />
            Télécharger le justificatif
          </button>
          <Link
            to="/client/espace"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Voir mes réservations
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Réservation effectuée le {dateReservation}
        </p>
      </div>
    </Layout>
  )
}

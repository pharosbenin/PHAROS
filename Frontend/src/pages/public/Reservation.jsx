import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Trash2, Plus, Minus, ChevronLeft, User, Mail, Phone, AlertCircle, Building2, Info, Lock, Loader2, Eye, EyeOff, UserPlus, Calendar, X, CheckCircle, Star, Bell } from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const BACKEND_URL = 'http://localhost:8000'
function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BACKEND_URL + path
}

export default function Reservation() {
  const navigate = useNavigate()
  const { user, loading: authLoading, login } = useAuth()
  const [searchParams] = useSearchParams()
  const hotelId = searchParams.get('hotelId') || '1'
  const chambreIdParam = searchParams.get('chambreId')
  const arriveeParam = searchParams.get('arrivee') || ''
  const departParam = searchParams.get('depart') || ''

  const [hotel, setHotel] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [dateArrivee, setDateArrivee] = useState(arriveeParam)
  const [dateDepart, setDateDepart] = useState(departParam)
  const [panier, setPanier] = useState([])
  const [voyageurs, setVoyageurs] = useState(1)
  const [clientInfo, setClientInfo] = useState({
    nom: user?.last_name || user?.nom || '',
    prenom: user?.first_name || user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
  })
  const [erreurDates, setErreurDates] = useState('')
  const [chambresDispoIds, setChambresDispoIds] = useState(null)
  const [creerCompte, setCreerCompte] = useState(false)
  const [motDePasse, setMotDePasse] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showInscriptionModal, setShowInscriptionModal] = useState(false)
  const [compteTimer, setCompteTimer] = useState(12)
  const inscriptionRef = useRef(null)

  useEffect(() => {
    if (!authLoading && !user) {
      const t = setTimeout(() => setShowInscriptionModal(true), 800)
      return () => clearTimeout(t)
    }
  }, [authLoading, user])

  useEffect(() => {
    if (!showInscriptionModal) return
    setCompteTimer(12)
    const interval = setInterval(() => {
      setCompteTimer(v => {
        if (v <= 1) { clearInterval(interval); setShowInscriptionModal(false); return 0 }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showInscriptionModal])

  useEffect(() => {
    if (authLoading || user?.role === 'gestionnaire' || user?.role === 'admin') return
    api.get(`/hotels/${hotelId}/`)
      .then(res => {
        const h = res.data
        const chambres = (h.types_chambres || []).map(c => ({
          ...c,
          type: c.nom,
          prix: parseFloat(c.prix_nuit),
          dispo: c.est_disponible,
          photo: mediaUrl(c.photos?.[0]?.image),
        }))
        setHotel({ ...h, chambres })
      })
      .catch(() => setHotel(null))
      .finally(() => setChargement(false))
  }, [hotelId, user, authLoading])

  useEffect(() => {
    if (!dateArrivee || !dateDepart) return
    api.get(`/hotels/${hotelId}/chambres/?date_arrivee=${dateArrivee}&date_depart=${dateDepart}`)
      .then(res => setChambresDispoIds(new Set(res.data.map(c => c.id))))
      .catch(() => setChambresDispoIds(null))
  }, [hotelId, dateArrivee, dateDepart])

  useEffect(() => {
    if (!chambreIdParam || !hotel?.chambres?.length || panier.length > 0) return
    const chambre = hotel.chambres.find(c => String(c.id) === String(chambreIdParam))
    if (!chambre) return
    const dispo = chambresDispoIds !== null ? chambresDispoIds.has(chambre.id) : chambre.dispo
    if (dispo) {
      setPanier([{ ...chambre, quantite: 1 }])
    }
  }, [chambreIdParam, hotel, chambresDispoIds])

  const nuits = dateArrivee && dateDepart
    ? Math.max(0, Math.round((new Date(dateDepart) - new Date(dateArrivee)) / 86400000))
    : 0

  const total = panier.reduce((sum, item) => sum + item.prix * nuits, 0)

  const ajouterChambre = (chambre) => {
    if (!dateArrivee || !dateDepart) {
      setErreurDates("Veuillez d'abord sélectionner vos dates de séjour.")
      return
    }
    setErreurDates('')
    setPanier(prev => {
      const nouveau = [...prev, chambre]
      const maxCap = nouveau.reduce((sum, p) => sum + p.capacite, 0)
      setVoyageurs(v => Math.min(v, maxCap))
      return nouveau
    })
  }

  const retirerChambre = (id) => {
    setPanier(prev => {
      const nouveau = prev.filter(p => p.id !== id)
      const maxCap = nouveau.reduce((sum, p) => sum + p.capacite, 0) || 10
      setVoyageurs(v => Math.min(v, maxCap))
      return nouveau
    })
  }

  const maxVoyageurs = panier.length > 0
    ? panier.reduce((sum, p) => sum + p.capacite, 0)
    : 10

  const valider = async (e) => {
    e.preventDefault()
    if (!dateArrivee || !dateDepart) { setErreurDates('Veuillez sélectionner vos dates.'); return }
    if (nuits === 0) { setErreurDates("La date de départ doit être après la date d'arrivée."); return }
    if (panier.length === 0) return
    const tel = clientInfo.telephone.trim()
    if (!tel || tel.length !== 10 || !tel.startsWith('01')) {
      setErreurDates('Numéro de téléphone invalide. 10 chiffres requis, commençant par 01 (ex: 0197000000).')
      return
    }
    if (creerCompte && motDePasse.length < 8) {
      setErreurDates('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setEnvoi(true)
    setErreurDates('')
    try {
      if (creerCompte && !user) {
        try {
          const resInscription = await api.post('/auth/inscription/', {
            username: clientInfo.email,
            email: clientInfo.email,
            first_name: clientInfo.prenom,
            last_name: clientInfo.nom,
            telephone: clientInfo.telephone ? `+229${clientInfo.telephone}` : '',
            password: motDePasse,
            password2: motDePasse,
            role: 'client',
          })
          const { tokens, user: newUser } = resInscription.data
          localStorage.setItem('pharos_refresh', tokens.refresh)
          login(newUser, tokens.access)
        } catch (err) {
          const data = err.response?.data
          const msgs = data ? Object.values(data).flat() : []
          setErreurDates(msgs[0] || "Erreur lors de la création du compte.")
          setEnvoi(false)
          return
        }
      }

      const chambre = panier[0]
      const res = await api.post('/reservations/', {
        hotel: parseInt(hotelId),
        type_chambre: chambre.id,
        nom_client: clientInfo.nom,
        prenom_client: clientInfo.prenom,
        email_client: clientInfo.email,
        telephone_client: clientInfo.telephone || '',
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        nb_adultes: voyageurs,
        nb_enfants: 0,
      })
      const reservation = res.data
      navigate('/paiement', {
        state: {
          reservationNumero: reservation.numero,
          hotelNom: hotel?.nom,
          panier,
          dateArrivee,
          dateDepart,
          nuits,
          total: parseFloat(reservation.prix_total),
          commissionTaux: hotel?.type_abonnement === 'pro' ? 5 : 3,
          clientInfo,
        }
      })
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.values(data).flat()
        setErreurDates(msgs[0] || 'Erreur lors de la réservation')
      } else {
        setErreurDates('Erreur de connexion. Vérifiez que le serveur est démarré.')
      }
    } finally {
      setEnvoi(false)
    }
  }

  const chambres = hotel?.chambres || []

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      </Layout>
    )
  }

  if (user && ['gestionnaire', 'admin'].includes(user.role)) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Lock size={32} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-500 text-sm mb-6">Les comptes gestionnaire et administrateur ne peuvent pas effectuer de réservations.</p>
          <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
            Retour à l'accueil
          </button>
        </div>
      </Layout>
    )
  }

  if (chargement) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      </Layout>
    )
  }

  if (!hotel) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Building2 size={32} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hôtel introuvable</h2>
          <button onClick={() => navigate('/recherche')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold mt-4">
            Retour à la recherche
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Modal inscription invité */}
      {showInscriptionModal && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 relative">
            <button onClick={() => setShowInscriptionModal(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X size={16} />
            </button>

            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-5">
              <Bell size={28} className="text-blue-600" />
            </div>

            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Créez votre compte PHAROS</h2>
            <p className="text-xs text-gray-400 text-center mb-6">Rejoignez-nous pour une meilleure expérience</p>

            <div className="space-y-3 mb-6">
              {[
                { text: 'Suivez toutes vos réservations en temps réel' },
                { text: 'Modifiez ou annulez en ligne à tout moment' },
                { text: 'Vos informations sauvegardées en toute sécurité' },
              ].map(({ text }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowInscriptionModal(false)
                setCreerCompte(true)
                setTimeout(() => inscriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
              }}
              className="w-full bg-blue-600 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl text-sm transition-colors mb-2"
            >
              S'inscrire maintenant
            </button>
            <button
              onClick={() => setShowInscriptionModal(false)}
              className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
            >
              Continuer sans compte
            </button>
            <p className="text-xs text-gray-300 text-center mt-3">
              Fermeture automatique dans {compteTimer}s
            </p>
          </div>
        </div>
      )}

      {/* En-tête de page */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-orange-600 hover:bg-blue-600 text-white text-sm mb-5 px-4 py-2 rounded-xl font-semibold transition-colors shadow-md">
            <ChevronLeft size={16} />
            Retour à l'établissement
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Votre réservation</h1>
              <p className="text-gray-500 text-sm flex items-center gap-1.5">
                <Building2 size={13} />
                {hotel.nom} · {hotel.ville}
              </p>
            </div>
            {hotel.note_moyenne > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-center shrink-0">
                <div className="text-orange-500 font-bold text-xl leading-none">{hotel.note_moyenne}</div>
                <div className="text-orange-400 text-xs flex items-center gap-1 mt-1">
                  <Star size={10} fill="currentColor" /> {hotel.nombre_avis} avis
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">

            {/* Étape 1 — Dates */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <h2 className="font-semibold text-gray-900 text-sm">Dates du séjour</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Calendar size={11} /> Arrivée
                    </div>
                    <div className="text-gray-900 font-semibold text-sm">
                      {dateArrivee
                        ? new Date(dateArrivee + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : <span className="text-gray-400 font-normal italic">Non définie</span>}
                    </div>
                  </div>
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Calendar size={11} /> Départ
                    </div>
                    <div className="text-gray-900 font-semibold text-sm">
                      {dateDepart
                        ? new Date(dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : <span className="text-gray-400 font-normal italic">Non définie</span>}
                    </div>
                  </div>
                </div>

                {nuits > 0 && (
                  <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                    <Calendar size={13} />
                    {nuits} nuit{nuits > 1 ? 's' : ''}
                  </div>
                )}

                {erreurDates && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-red-600 text-sm mb-4">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{erreurDates}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Nombre de voyageurs</p>
                    {panier[0] && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Maximum {panier[0].capacite} personne{panier[0].capacite > 1 ? 's' : ''} pour cette chambre
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                    <button onClick={() => setVoyageurs(v => Math.max(1, v - 1))}
                      disabled={voyageurs <= 1}
                      className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                      <Minus size={14} />
                    </button>
                    <span className="text-base font-bold text-gray-800 w-8 text-center">{voyageurs}</span>
                    <button onClick={() => setVoyageurs(v => Math.min(v + 1, maxVoyageurs))}
                      disabled={voyageurs >= maxVoyageurs}
                      className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 2 — Chambres */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${panier.length > 0 ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                  {panier.length > 0 ? <CheckCircle size={14} /> : '2'}
                </span>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">Sélection des chambres</h2>
                  {panier.length > 0 && (
                    <p className="text-xs text-green-600 mt-0.5">{panier.length} chambre{panier.length > 1 ? 's' : ''} sélectionnée{panier.length > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <div className="p-6">
                {!dateArrivee || !dateDepart ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Info size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Dates requises</p>
                      <p className="text-xs text-amber-600 mt-0.5">Sélectionnez vos dates pour voir les chambres disponibles.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chambres.map(chambre => {
                      const estDispo = chambresDispoIds !== null ? chambresDispoIds.has(chambre.id) : chambre.dispo
                      const inPanier = panier.find(p => p.id === chambre.id)
                      return (
                        <div key={chambre.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${
                          !estDispo ? 'border-gray-100 opacity-50'
                          : inPanier ? 'border-blue-400 shadow-md shadow-blue-50'
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        }`}>
                          <div className="flex">
                            {chambre.photo && (
                              <div className="w-28 sm:w-36 shrink-0">
                                <img src={chambre.photo} alt={chambre.type} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 p-4 flex items-center justify-between gap-3 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 text-sm">{chambre.type}</p>
                                  {inPanier && (
                                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">Sélectionné</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                                  <User size={11} /> {chambre.capacite} personne{chambre.capacite > 1 ? 's' : ''} max
                                </p>
                                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                                  <span className="text-blue-600 font-bold text-base">{chambre.prix.toLocaleString()}</span>
                                  <span className="text-xs text-gray-400">FCFA / nuit</span>
                                  {nuits > 0 && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                      = {(chambre.prix * nuits).toLocaleString()} FCFA
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0">
                                {!estDispo ? (
                                  <span className="text-xs text-red-500 font-semibold bg-red-50 px-3 py-1.5 rounded-xl">Indisponible</span>
                                ) : inPanier ? (
                                  <button onClick={() => retirerChambre(chambre.id)}
                                    className="flex items-center gap-1.5 text-sm border-2 border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors font-medium">
                                    <Trash2 size={13} /> Retirer
                                  </button>
                                ) : (
                                  <button onClick={() => ajouterChambre(chambre)}
                                    className="flex items-center gap-1.5 text-sm bg-orange-600 hover:bg-blue-600 text-white px-4 py-1.5 rounded-xl transition-colors font-semibold shadow-sm">
                                    <Plus size={13} /> Ajouter
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Étape 3 — Informations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <h2 className="font-semibold text-gray-900 text-sm">Vos informations</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Prénom *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={clientInfo.prenom} onChange={e => setClientInfo(p => ({ ...p, prenom: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '') }))}
                        placeholder="Votre prénom"
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nom *</label>
                    <input type="text" value={clientInfo.nom} onChange={e => setClientInfo(p => ({ ...p, nom: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '') }))}
                      placeholder="Votre nom"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={clientInfo.email} onChange={e => setClientInfo(p => ({ ...p, email: e.target.value }))}
                        placeholder="votre@email.com"
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Téléphone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" value={clientInfo.telephone}
                        onChange={e => { setClientInfo(p => ({ ...p, telephone: e.target.value.replace(/\D/g, '').slice(0, 10) })); setErreurDates('') }}
                        placeholder="01XXXXXXXX"
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                    </div>
                  </div>
                </div>

                {!user && (
                  <div ref={inscriptionRef} className="mt-5 pt-5 border-t border-gray-100">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${creerCompte ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}
                        onClick={() => { setCreerCompte(v => !v); setMotDePasse('') }}>
                        {creerCompte && <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div onClick={() => { setCreerCompte(v => !v); setMotDePasse('') }}>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                          <UserPlus size={14} className="text-blue-600" /> Créer un compte PHAROS
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Suivez vos réservations, modifiez ou annulez en ligne</p>
                      </div>
                    </label>

                    {creerCompte && (
                      <div className="mt-4 pl-8 space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                            Mot de passe <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={motDePasse}
                              onChange={e => setMotDePasse(e.target.value)}
                              placeholder="Minimum 8 caractères"
                              className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                            />
                            <button type="button" onClick={() => setShowPassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {motDePasse && (
                            <div className="flex gap-1.5 mt-2">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                                  motDePasse.length >= (i + 1) * 2
                                    ? motDePasse.length >= 8 ? 'bg-green-400' : 'bg-amber-400'
                                    : 'bg-gray-200'
                                }`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          En cochant cette case, vous acceptez les{' '}
                          <span className="text-blue-600 cursor-pointer hover:underline">conditions d'utilisation</span>{' '}
                          de PHAROS BÉNIN.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 rounded-2xl overflow-hidden shadow-xl border border-gray-100">

              {/* En-tête hôtel */}
              <div className="bg-gradient-to-br from-orange-700 to-orange-600 px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">{hotel.nom}</h3>
                    <p className="text-blue-200 text-xs mt-0.5">{hotel.ville}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Récapitulatif</h2>

                {panier.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Building2 size={20} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm">Aucune chambre sélectionnée</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {panier.map(item => (
                      <div key={item.id} className="flex items-start justify-between gap-2 bg-gray-50 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.type}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {nuits} nuit{nuits > 1 ? 's' : ''} × {item.prix.toLocaleString()} FCFA
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-sm font-bold text-gray-900">
                            {(item.prix * nuits).toLocaleString()}
                            <span className="text-xs font-normal text-gray-400"> FCFA</span>
                          </p>
                          <button onClick={() => retirerChambre(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {nuits > 0 && panier.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sous-total</span>
                      <span className="text-gray-700">{total.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Taxes & frais</span>
                      <span className="text-gray-400">inclus</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-gray-100">
                      <span className="font-bold text-gray-900">Total</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 leading-none">{total.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 mt-0.5">FCFA · {nuits} nuit{nuits > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={valider}
                  disabled={panier.length === 0 || nuits === 0 || !clientInfo.nom || !clientInfo.email || envoi}
                  className="w-full mt-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 disabled:shadow-none"
                >
                  {envoi ? (
                    <><Loader2 size={18} className="animate-spin" /> Création en cours...</>
                  ) : panier.length === 0 ? 'Sélectionnez une chambre' :
                    nuits === 0 ? 'Choisissez vos dates' :
                      !clientInfo.nom || !clientInfo.email ? 'Remplissez vos infos' :
                        `Payer ${total.toLocaleString()} FCFA →`}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Lock size={11} className="text-gray-400" />
                  <p className="text-xs text-gray-400">Paiement 100% sécurisé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

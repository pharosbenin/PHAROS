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
      // Inscription si demandée
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

  // Garde synchrone — bloque le rendu si l'auth est encore en cours ou si le rôle est interdit
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
          <Lock size={48} className="text-gray-300 mx-auto mb-4" />
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
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
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
      {/* Popup inscription pour invités */}
      {showInscriptionModal && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-fade-in">
            <button onClick={() => setShowInscriptionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>

            <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mx-auto mb-4">
              <Bell size={26} className="text-blue-600" />
            </div>

            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Créez votre compte PHAROS</h2>
            <p className="text-xs text-gray-400 text-center mb-5">Rejoignez-nous pour une meilleure expérience</p>

            <div className="space-y-3 mb-6">
              {[
                { icon: CheckCircle, text: 'Suivez toutes vos réservations en temps réel' },
                { icon: Star, text: 'Modifiez ou annulez en ligne à tout moment' },
                { icon: Lock, text: 'Vos informations sauvegardées en toute sécurité' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700">{text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowInscriptionModal(false)
                setCreerCompte(true)
                setTimeout(() => inscriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors mb-2"
            >
              S'inscrire maintenant
            </button>
            <button
              onClick={() => setShowInscriptionModal(false)}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-1.5 transition-colors"
            >
              Continuer sans compte
            </button>

            <p className="text-xs text-gray-300 text-center mt-3">
              Fermeture automatique dans {compteTimer}s
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ChevronLeft size={18} />
          Retour à l'établissement
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Votre réservation</h1>
        <p className="text-gray-500 text-sm mb-6">{hotel.nom} · {hotel.ville}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">

            {/* Dates */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Dates du séjour</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Arrivée</label>
                  <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    {dateArrivee ? new Date(dateArrivee + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Départ</label>
                  <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    {dateDepart ? new Date(dateDepart + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>
              {nuits > 0 && (
                <p className="text-sm text-blue-600 font-medium mt-2 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                  {nuits} nuit{nuits > 1 ? 's' : ''} sélectionnée{nuits > 1 ? 's' : ''}
                </p>
              )}
              {erreurDates && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={15} />
                  {erreurDates}
                </div>
              )}
              <div className="mt-3">
                <label className="text-xs text-gray-400 font-medium block mb-1">
                  Nombre de voyageurs
                  {panier[0] && <span className="text-gray-300 ml-1">(max {panier[0].capacite} pers.)</span>}
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setVoyageurs(v => Math.max(1, v - 1))}
                    disabled={voyageurs <= 1}
                    className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{voyageurs}</span>
                  <button onClick={() => setVoyageurs(v => Math.min(v + 1, maxVoyageurs))}
                    disabled={voyageurs >= maxVoyageurs}
                    className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Choix des chambres */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Sélection des chambres</h2>
              {!dateArrivee || !dateDepart ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-2">
                  <Info size={15} className="shrink-0" /> Sélectionnez vos dates de séjour pour ajouter des chambres.
                </div>
              ) : (
                <div className="space-y-3">
                  {chambres.map(chambre => {
                    const estDispo = chambresDispoIds !== null ? chambresDispoIds.has(chambre.id) : chambre.dispo
                    const inPanier = panier.find(p => p.id === chambre.id)
                    return (
                      <div key={chambre.id} className={`flex items-center justify-between p-4 rounded-xl border ${!estDispo ? 'border-gray-100 opacity-50' : inPanier ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:border-gray-200'} transition-colors`}>
                        <div className="flex items-center gap-3 flex-1">
                          {chambre.photo && (
                            <img src={chambre.photo} alt={chambre.type} className="w-16 h-12 object-cover rounded-lg shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{chambre.type}</p>
                            <p className="text-xs text-gray-400">Capacité : {chambre.capacite} pers.</p>
                            <p className="text-blue-600 font-semibold text-sm mt-0.5">
                              {chambre.prix.toLocaleString()} FCFA/nuit
                              {nuits > 0 && <span className="text-gray-400 font-normal"> · {(chambre.prix * nuits).toLocaleString()} FCFA total</span>}
                            </p>
                          </div>
                        </div>
                        <div>
                          {!estDispo ? (
                            <span className="text-xs text-red-500 font-medium">Non disponible</span>
                          ) : inPanier ? (
                            <button onClick={() => retirerChambre(chambre.id)}
                              className="text-sm border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                              Retirer
                            </button>
                          ) : (
                            <button onClick={() => ajouterChambre(chambre)}
                              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                              Ajouter
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Informations client */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Vos informations</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Prénom *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={clientInfo.prenom} onChange={e => setClientInfo(p => ({ ...p, prenom: e.target.value }))}
                      placeholder="Votre prénom"
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Nom *</label>
                  <input type="text" value={clientInfo.nom} onChange={e => setClientInfo(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Votre nom"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Email *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={clientInfo.email} onChange={e => setClientInfo(p => ({ ...p, email: e.target.value }))}
                      placeholder="votre@email.com"
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Téléphone <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={clientInfo.telephone} onChange={e => { setClientInfo(p => ({ ...p, telephone: e.target.value.replace(/\D/g, '').slice(0, 10) })); setErreurDates('') }}
                      placeholder="01XXXXXXXX"
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400" />
                  </div>
                </div>
              </div>

              {/* Case à cocher inscription */}
              {!user && (
                <div ref={inscriptionRef} className="mt-4 pt-4 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${creerCompte ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}
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
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1">Mot de passe <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={motDePasse}
                            onChange={e => setMotDePasse(e.target.value)}
                            placeholder="Minimum 8 caractères"
                            className="w-full border border-gray-200 rounded-lg pl-9 pr-10 py-2 text-sm outline-none focus:border-blue-400"
                          />
                          <button type="button" onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {motDePasse && (
                          <div className="flex gap-1 mt-1.5">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                motDePasse.length >= (i + 1) * 2
                                  ? motDePasse.length >= 8 ? 'bg-green-400' : 'bg-amber-400'
                                  : 'bg-gray-200'
                              }`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        En cochant cette case, vous acceptez les <span className="text-blue-600 cursor-pointer hover:underline">conditions d'utilisation</span> de PHAROS BÉNIN.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 sticky top-32">
              <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif</h2>

              {panier.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Aucune chambre sélectionnée</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {panier.map(item => (
                    <div key={item.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.type}</p>
                        <p className="text-xs text-gray-400">{nuits} nuit{nuits > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {(item.prix * nuits).toLocaleString()} FCFA
                        </p>
                        <button onClick={() => retirerChambre(item.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {nuits > 0 && panier.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span className="text-blue-600">{total.toLocaleString()} FCFA</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{nuits} nuit{nuits > 1 ? 's' : ''} · taxes incluses</p>
                </div>
              )}

              <button
                onClick={valider}
                disabled={panier.length === 0 || nuits === 0 || !clientInfo.nom || !clientInfo.email || envoi}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {envoi ? (
                  <><Loader2 size={18} className="animate-spin" /> Création...</>
                ) : panier.length === 0 ? 'Sélectionnez une chambre' :
                  nuits === 0 ? 'Choisissez vos dates' :
                    !clientInfo.nom || !clientInfo.email ? 'Remplissez vos infos' :
                      `Payer ${total.toLocaleString()} FCFA`}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1"><Lock size={11} /> Paiement sécurisé</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

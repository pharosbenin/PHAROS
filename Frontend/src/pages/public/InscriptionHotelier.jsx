import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import {
  Building2, User, Mail, Lock, Phone, MapPin, Upload, FileText,
  ChevronRight, ChevronLeft, Eye, EyeOff, X, CheckCircle,
  AlertCircle, Percent, Clock, Info, Camera, Globe
} from 'lucide-react'
import Layout from '../../components/common/Layout'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STORAGE_KEY = 'pharos_inscription_hotelier'

// L'attribut accept du <input type="file"> n'est qu'indicatif (contournable via "Tous les
// fichiers" ou le glisser-déposer) — on revalide donc l'extension ici après sélection. Le
// contenu réel est revérifié côté serveur (impossible de se fier uniquement à l'extension).
const EXTENSIONS_DOCUMENT_AUTORISEES = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const extensionAutorisee = (fichier) => {
  const ext = fichier.name.includes('.') ? fichier.name.split('.').pop().toLowerCase() : ''
  return EXTENSIONS_DOCUMENT_AUTORISEES.includes(ext)
}

const VILLES_COORDS = {
  'Cotonou': [6.3654, 2.4183],
  'Porto-Novo': [6.4969, 2.6289],
  'Adjohoun': [6.6833, 2.6167],
  'Akpro-Missérété': [6.5667, 2.6167],
  'Avrankou': [6.5667, 2.6667],
  'Bonou': [6.9000, 2.4667],
  'Dangbo': [6.6167, 2.5667],
  'Missérété': [6.5333, 2.5833],
  'Sèmè-Kpodji': [6.3667, 2.6000],
  'Abomey-Calavi': [6.4487, 2.3544],
  'Allada': [6.6667, 2.1500],
  'Ouidah': [6.3601, 2.0800],
  'Kpomassè': [6.5000, 1.9833],
  'Sô-Ava': [6.4833, 2.4167],
  'Toffo': [6.8500, 2.0833],
  'Tori-Bossito': [6.5667, 2.1500],
  'Zè': [6.7167, 2.2333],
  'Parakou': [9.3372, 2.6276],
  'Bembèrèkè': [10.2246, 2.6641],
  'Kalalé': [10.2979, 3.3736],
  "N'Dali": [9.8625, 2.7130],
  'Nikki': [9.9380, 3.2103],
  'Pèrèrè': [10.4167, 3.0500],
  'Sinendé': [10.0167, 2.3833],
  'Tchaourou': [8.8780, 2.5960],
  'Abomey': [7.1828, 1.9936],
  'Bohicon': [7.1750, 2.0644],
  'Agbangnizoun': [7.1667, 1.9333],
  'Covè': [7.2833, 2.3833],
  'Djidja': [7.3500, 1.9667],
  'Ouinhi': [7.0000, 2.4667],
  'Zagnanado': [7.2500, 2.3333],
  'Za-Kpota': [7.0667, 2.2167],
  'Zogbodomè': [7.0667, 2.0500],
  'Dassa-Zoumè': [7.7497, 2.1758],
  'Glazoué': [7.9833, 2.2167],
  'Bantè': [8.4167, 1.8833],
  'Ouèssè': [8.5667, 2.5167],
  'Savalou': [7.9338, 1.9758],
  'Savè': [8.0333, 2.4833],
  'Natitingou': [10.3038, 1.3822],
  'Boukoumbé': [10.1833, 1.1000],
  'Cobly': [10.4833, 1.0000],
  'Copargo': [9.8333, 1.5500],
  'Kérou': [10.8167, 2.1000],
  'Kouandé': [10.3333, 1.6833],
  'Matéri': [10.7167, 1.0500],
  'Péhunco': [10.5500, 1.5167],
  'Tanguiéta': [10.6167, 1.2667],
  'Toukountouna': [10.4667, 1.3333],
  'Malanville': [11.8672, 3.3893],
  'Banikoara': [11.3000, 2.4333],
  'Gogounou': [10.8333, 2.8333],
  'Kandi': [11.1332, 2.9370],
  'Karimama': [12.0667, 3.1833],
  'Ségbana': [10.9333, 3.7000],
  'Djougou': [9.7085, 1.6671],
  'Bassila': [9.0000, 1.6667],
  'Ouaké': [9.7167, 1.3833],
  'Lokossa': [6.6363, 1.7185],
  'Athiémé': [6.5833, 1.6833],
  'Bopa': [6.7667, 1.7833],
  'Comè': [6.4000, 1.8833],
  'Grand-Popo': [6.2833, 1.8167],
  'Houéyogbé': [6.6833, 1.7333],
  'Aplahoué': [6.9341, 1.6844],
  'Djakotomey': [6.8833, 1.6833],
  'Dogbo': [6.8000, 1.7833],
  'Klouékanmè': [6.9667, 1.7333],
  'Lalo': [6.9167, 1.8833],
  'Toviklin': [7.0000, 1.7833],
  'Kétou': [7.3583, 2.5984],
  'Pobè': [6.9833, 2.6667],
  'Sakété': [6.7333, 2.6500],
  'Adja-Ouèrè': [7.0167, 2.4667],
  'Ifangni': [6.6500, 2.7167],
}

// Centre par défaut = Bénin
const BENIN_CENTER = [9.3077, 2.3158]

function CentreurVille({ ville }) {
  const map = useMap()
  useEffect(() => {
    if (ville && VILLES_COORDS[ville]) {
      map.setView(VILLES_COORDS[ville], 14, { animate: true })
    }
  }, [ville, map])
  return null
}

function CliqueurCarte({ onClic }) {
  useMapEvents({ click: e => onClic(e.latlng.lat, e.latlng.lng) })
  return null
}

function CarteLocalisation({ ville, latitude, longitude, onChange }) {
  const position = latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : null
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium block mb-1.5 flex items-center gap-1">
        <MapPin size={12} /> Emplacement sur la carte
        <span className="text-gray-400 font-normal">(facultatif)</span>
      </label>
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 260 }}>
        <MapContainer
          center={ville && VILLES_COORDS[ville] ? VILLES_COORDS[ville] : BENIN_CENTER}
          zoom={ville ? 13 : 7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CentreurVille ville={ville} />
          <CliqueurCarte onClic={(lat, lng) => onChange(lat.toFixed(6), lng.toFixed(6))} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
      {position
        ? <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
            <CheckCircle size={11} /> Marqueur posé · {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
          </p>
        : <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Info size={11} /> Sélectionnez d'abord une ville, puis cliquez sur l'emplacement exact de votre hôtel
          </p>
      }
    </div>
  )
}

const VILLES_BENIN = [
  // Littoral
  'Cotonou',
  // Ouémé
  'Porto-Novo', 'Adjohoun', 'Akpro-Missérété', 'Avrankou', 'Bonou', 'Dangbo', 'Missérété', 'Sèmè-Kpodji',
  // Atlantique
  'Abomey-Calavi', 'Allada', 'Ouidah', 'Kpomassè', 'Sô-Ava', 'Toffo', 'Tori-Bossito', 'Zè',
  // Borgou
  'Parakou', 'Bembèrèkè', 'Kalalé', "N'Dali", 'Nikki', 'Pèrèrè', 'Sinendé', 'Tchaourou',
  // Zou
  'Abomey', 'Bohicon', 'Agbangnizoun', 'Covè', 'Djidja', 'Ouinhi', 'Zagnanado', 'Za-Kpota', 'Zogbodomè',
  // Collines
  'Dassa-Zoumè', 'Glazoué', 'Bantè', 'Ouèssè', 'Savalou', 'Savè',
  // Atacora
  'Natitingou', 'Boukoumbé', 'Cobly', 'Copargo', 'Kérou', 'Kouandé', 'Matéri', 'Péhunco', 'Tanguiéta', 'Toukountouna',
  // Alibori
  'Malanville', 'Banikoara', 'Gogounou', 'Kandi', 'Karimama', 'Ségbana',
  // Donga
  'Djougou', 'Bassila', 'Ouaké',
  // Mono
  'Lokossa', 'Athiémé', 'Bopa', 'Comè', 'Grand-Popo', 'Houéyogbé',
  // Couffo
  'Aplahoué', 'Djakotomey', 'Dogbo', 'Klouékanmè', 'Lalo', 'Toviklin',
  // Plateau
  'Kétou', 'Pobè', 'Sakété', 'Adja-Ouèrè', 'Ifangni',
]

const ETAPES = [
  { num: 1, label: 'Compte' },
  { num: 2, label: 'Établissement' },
  { num: 3, label: 'Photos' },
  { num: 4, label: 'Documents' },
]

const COMPTE_VIDE = {
  prenom: '', nom: '', email: '', telephone: '',
  password: '', confirmPassword: '', photoPreview: null
}

const ETAB_VIDE = {
  nom: '', description: '', adresse: '', ville: '',
  latitude: '', longitude: '', videoYoutube: '',
  tauxAnnulation: '', tauxModification: ''
}

export default function InscriptionHotelier() {
  const [etape, setEtape] = useState(1)
  const [soumis, setSoumis] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const photoProfilRef = useRef()
  const photoRef = useRef()
  const registreRef = useRef()
  const identiteRef = useRef()

  // OTP
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpErreur, setOtpErreur] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [otpEnvoi, setOtpEnvoi] = useState(false)
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  const [compte, setCompte] = useState(COMPTE_VIDE)
  const [etab, setEtab] = useState(ETAB_VIDE)
  const [photos, setPhotos] = useState([])
  const [docs, setDocs] = useState({ registre: null, identite: null })

  // Restaurer depuis sessionStorage au montage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.etape) setEtape(data.etape)
        if (data.compte) setCompte(prev => ({ ...prev, ...data.compte, photoPreview: null }))
        if (data.etab) setEtab(data.etab)
      }
    } catch {}
  }, [])

  // Sauvegarder dans sessionStorage à chaque changement
  useEffect(() => {
    if (soumis) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        etape,
        compte: { ...compte, photoPreview: null },
        etab,
      }))
    } catch {}
  }, [etape, compte, etab, soumis])

  // Compte à rebours OTP
  useEffect(() => {
    if (otpTimer <= 0) return
    const t = setTimeout(() => setOtpTimer(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [otpTimer])

  const envoyerOtp = async () => {
    setOtpErreur('')
    setOtpLoading(true)
    try {
      const tel = `+229${compte.telephone}`
      const { data } = await api.post('/auth/otp/envoyer/', { telephone: tel })
      setOtpTimer(300)
      setOtpDigits(['', '', '', '', '', ''])
      if (data.dev_code) {
        setTimeout(() => setOtpDigits(data.dev_code.split('')), 3000)
      } else {
        setTimeout(() => otpRefs[0].current?.focus(), 100)
      }
    } catch (err) {
      setOtpErreur(err.response?.data?.detail || 'Impossible d\'envoyer le code. Réessayez.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOtpDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otpDigits]
    next[i] = val
    setOtpDigits(next)
    if (val && i < 5) otpRefs[i + 1].current?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpRefs[i - 1].current?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''))
      otpRefs[5].current?.focus()
    }
  }

  const verifierOtp = async () => {
    const code = otpDigits.join('')
    if (code.length < 6) { setOtpErreur('Entrez les 6 chiffres du code.'); return }
    setOtpErreur('')
    setOtpLoading(true)
    try {
      await api.post('/auth/otp/verifier/', { telephone: `+229${compte.telephone}`, code })
      setShowOtpModal(false)
      setEtape(2)
    } catch (err) {
      setOtpErreur(err.response?.data?.detail || 'Code incorrect. Réessayez.')
    } finally {
      setOtpLoading(false)
    }
  }

  const setC = (k, v) => setCompte(p => ({ ...p, [k]: v }))
  const setE = (k, v) => setEtab(p => ({ ...p, [k]: v }))

  const ajouterPhotos = (files) => {
    const nouvelles = Array.from(files).map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setPhotos(p => [...p, ...nouvelles].slice(0, 5))
  }

  const validerEtape = () => {
    setErreur('')
    if (etape === 1) {
      if (!compte.prenom || !compte.nom || !compte.email || !compte.telephone || !compte.password || !compte.confirmPassword) {
        setErreur('Veuillez remplir tous les champs obligatoires.')
        return false
      }
      if (compte.telephone.length !== 10 || !compte.telephone.startsWith('01')) {
        setErreur('Le numéro de téléphone doit contenir 10 chiffres et commencer par 01.')
        return false
      }
      if (compte.password.length < 8) {
        setErreur('Le mot de passe doit contenir au moins 8 caractères.')
        return false
      }
      if (compte.password !== compte.confirmPassword) {
        setErreur('Les mots de passe ne correspondent pas.')
        return false
      }
    }
    if (etape === 2) {
      if (!etab.nom || !etab.description || !etab.adresse || !etab.ville || !etab.tauxAnnulation || !etab.tauxModification) {
        setErreur('Veuillez remplir tous les champs obligatoires.')
        return false
      }
    }
    if (etape === 3) {
      if (photos.length < 1) {
        setErreur('Veuillez ajouter au moins 1 photo de votre établissement.')
        return false
      }
    }
    if (etape === 4) {
      if (!docs.registre || !docs.identite) {
        setErreur('Veuillez fournir les deux documents obligatoires.')
        return false
      }
    }
    return true
  }

  const suivant = async () => {
    if (!validerEtape()) return
    if (etape === 1) {
      setShowOtpModal(true)
      envoyerOtp()
      return
    }
    if (etape < 4) {
      setEtape(e => e + 1)
      return
    }

    setChargement(true)
    setErreur('')
    try {
      // 1. Créer le compte gestionnaire (ou récupérer le token si déjà créé)
      let token
      try {
        const username = compte.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Date.now().toString().slice(-4)
        const { data: resInscription } = await api.post('/auth/inscription/', {
          username,
          email: compte.email,
          first_name: compte.prenom,
          last_name: compte.nom,
          password: compte.password,
          password2: compte.confirmPassword,
          role: 'gestionnaire',
          telephone: compte.telephone ? `+229${compte.telephone}` : '',
        })
        token = resInscription.tokens.access
        console.log('[Inscription] Compte créé, token obtenu.')
      } catch (inscErr) {
        const errData = inscErr.response?.data
        console.error('[Inscription] Erreur:', inscErr.response?.status, errData || inscErr.message)
        const emailExiste = errData?.email?.some(m => m.toLowerCase().includes('existe'))
          || JSON.stringify(errData || '').toLowerCase().includes('existe')
        if (!emailExiste) throw inscErr
        // Le compte existe déjà → on se connecte pour récupérer le token
        console.log('[Inscription] Email déjà existant, tentative de connexion...')
        const { data: resLogin } = await api.post('/auth/connexion/', {
          username: compte.email,
          password: compte.password,
        })
        token = resLogin.access
        console.log('[Connexion] Token récupéré.')
      }

      const authHeader = { Authorization: `Bearer ${token}` }

      // 2. Créer l'hôtel — ne pas forcer Content-Type, axios gère FormData automatiquement
      const formHotel = new FormData()
      formHotel.append('nom', etab.nom)
      formHotel.append('description', etab.description)
      formHotel.append('adresse', etab.adresse)
      formHotel.append('ville', etab.ville)
      if (etab.latitude) formHotel.append('latitude', etab.latitude)
      if (etab.longitude) formHotel.append('longitude', etab.longitude)
      formHotel.append('taux_annulation', etab.tauxAnnulation || '20')
      formHotel.append('taux_modification', etab.tauxModification || '10')
      if (photos[0]?.file) formHotel.append('photo_principale', photos[0].file)
      if (docs.registre) formHotel.append('document_registre', docs.registre)
      if (docs.identite) formHotel.append('document_identite', docs.identite)

      console.log('[Hôtel] Envoi de la création...')
      const { data: resHotel } = await api.post('/gestionnaire/hotels/', formHotel, {
        headers: { ...authHeader, 'Content-Type': undefined },
      })
      console.log('[Hôtel] Créé avec succès, id:', resHotel.id)

      // 3. Uploader les photos supplémentaires
      for (let i = 1; i < photos.length; i++) {
        const formPhoto = new FormData()
        formPhoto.append('image', photos[i].file)
        await api.post(`/gestionnaire/hotels/${resHotel.id}/photos/`, formPhoto, {
          headers: { ...authHeader, 'Content-Type': undefined },
        })
      }

      sessionStorage.removeItem(STORAGE_KEY)
      setSoumis(true)
    } catch (err) {
      console.error('[Soumission] Erreur complète:', err.response?.status, err.response?.data, err.message)
      const data = err.response?.data
      const status = err.response?.status
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
        setErreur(msgs)
      } else if (status) {
        setErreur(`Erreur ${status} : ${typeof data === 'string' ? data.slice(0, 300) : err.message}`)
      } else {
        setErreur(`Erreur réseau : ${err.message}. Vérifiez que le serveur backend (port 8000) est démarré.`)
      }
    } finally {
      setChargement(false)
    }
  }

  const retour = () => {
    setEtape(e => e - 1)
    setErreur('')
  }

  if (soumis) {
    return (
      <Layout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Dossier soumis !</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Votre dossier a bien été transmis à l'équipe PHAROS BÉNIN. Nous allons examiner
            votre demande sous <strong>24 à 48h</strong>. Vous recevrez une notification
            par <strong>email et SMS</strong> dès que votre compte sera activé.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 text-left mb-8 flex gap-3">
            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p>Une fois validé, vous pourrez ajouter vos chambres, tarifs et disponibilités depuis votre tableau de bord.</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
      </Layout>
    )
  }

  return (
    <Layout>

    {/* ===== MODAL OTP ===== */}
    {showOtpModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Icône */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Phone size={28} className="text-blue-600" />
            </div>
          </div>

          <h2 className="text-xl font-black text-gray-900 text-center mb-1">Vérification du numéro</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Un code à 6 chiffres a été envoyé par SMS au<br />
            <span className="font-bold text-gray-800">+229 {compte.telephone}</span>
          </p>

          {/* 6 cases OTP */}
          <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
            {otpDigits.map((d, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleOtpDigit(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className={`w-11 h-13 text-center text-xl font-black border-2 rounded-xl outline-none transition-all
                  ${d ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                  focus:border-blue-600 focus:bg-blue-50`}
              />
            ))}
          </div>

          {/* Erreur */}
          {otpErreur && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              <AlertCircle size={16} className="shrink-0" />
              {otpErreur}
            </div>
          )}

          {/* Timer + Renvoyer */}
          <div className="text-center text-sm text-gray-500 mb-5">
            {otpTimer > 0 ? (
              <span>Renvoyer le code dans <strong className="text-blue-600">{Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</strong></span>
            ) : (
              <button onClick={envoyerOtp} disabled={otpLoading}
                className="text-blue-600 font-semibold hover:underline disabled:opacity-50">
                Renvoyer le code
              </button>
            )}
          </div>

          {/* Bouton vérifier */}
          <button
            onClick={verifierOtp}
            disabled={otpLoading || otpDigits.join('').length < 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors mb-3"
          >
            {otpLoading ? 'Vérification...' : 'Vérifier et continuer'}
          </button>

          {/* Annuler */}
          <button onClick={() => setShowOtpModal(false)}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2">
            ← Modifier mon numéro
          </button>
        </div>
      </div>
    )}

    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-xl">

        {/* Barre de progression */}
        <div className="flex items-center mb-8">
          {ETAPES.map((e, i) => (
            <div key={e.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  etape > e.num ? 'bg-green-500 text-white' :
                  etape === e.num ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {etape > e.num ? <CheckCircle size={16} /> : e.num}
                </div>
                <span className={`text-xs mt-1 font-medium whitespace-nowrap ${etape >= e.num ? 'text-gray-700' : 'text-gray-400'}`}>
                  {e.label}
                </span>
              </div>
              {i < ETAPES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${etape > e.num ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          {erreur && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{erreur}</p>
            </div>
          )}

          {/* ===== ÉTAPE 1 — INFORMATIONS PERSONNELLES ===== */}
          {etape === 1 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="font-black text-gray-900 text-lg">Informations personnelles</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ces informations serviront à créer votre compte hôtelier</p>
              </div>

              {/* Photo de profil */}
              <div className="flex items-center gap-4">
                <div
                  onClick={() => photoProfilRef.current.click()}
                  className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 overflow-hidden transition-colors shrink-0"
                >
                  {compte.photoPreview
                    ? <img src={compte.photoPreview} className="w-full h-full object-cover" alt="profil" />
                    : <Camera size={22} className="text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Photo de profil</p>
                  <p className="text-xs text-gray-400">Facultatif · JPG, PNG</p>
                  <button type="button" onClick={() => photoProfilRef.current.click()}
                    className="text-xs text-blue-600 hover:underline mt-0.5">
                    {compte.photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                  </button>
                </div>
                <input ref={photoProfilRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files[0]
                    if (f) setC('photoPreview', URL.createObjectURL(f))
                  }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Prénom *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={compte.prenom} onChange={e => setC('prenom', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, ''))}
                      placeholder="Jean"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Nom *</label>
                  <input type="text" value={compte.nom} onChange={e => setC('nom', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, ''))}
                    placeholder="Dupont"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Adresse email *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={compte.email} onChange={e => setC('email', e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Téléphone (MTN / Moov) *</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-3 focus-within:border-blue-400 transition-colors">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-500 font-medium">+229</span>
                  <div className="w-px h-4 bg-gray-200" />
                  <input type="tel" value={compte.telephone}
                    onChange={e => setC('telephone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="01XXXXXXXX" className="flex-1 text-sm text-gray-800 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Mot de passe *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={compte.password}
                    onChange={e => setC('password', e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {compte.password && (
                  <div className="flex gap-1 mt-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        compte.password.length >= (i + 1) * 2
                          ? compte.password.length >= 8 ? 'bg-green-400' : 'bg-amber-400'
                          : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Confirmer le mot de passe *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showConfirm ? 'text' : 'password'} value={compte.confirmPassword}
                    onChange={e => setC('confirmPassword', e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className={`w-full border rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-blue-400 transition-colors ${
                      compte.confirmPassword && compte.password !== compte.confirmPassword
                        ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {compte.confirmPassword && compte.password !== compte.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            </div>
          )}

          {/* ===== ÉTAPE 2 — INFORMATIONS ÉTABLISSEMENT ===== */}
          {etape === 2 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="font-black text-gray-900 text-lg">Informations de l'établissement</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ces informations seront vérifiées par notre équipe</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Nom de l'établissement *</label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={etab.nom} onChange={e => setE('nom', e.target.value)}
                    placeholder="Ex : Hôtel du Lac"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Description générale *</label>
                <textarea value={etab.description} onChange={e => setE('description', e.target.value)} rows={3}
                  placeholder="Décrivez votre établissement : ambiance, services, points forts..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none transition-colors" />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Adresse complète *</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={etab.adresse} onChange={e => setE('adresse', e.target.value)}
                    placeholder="Ex : Quartier Cadjehoun, Rue des Cocotiers"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Ville / Commune *</label>
                <select value={etab.ville} onChange={e => setE('ville', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white transition-colors">
                  <option value="">Sélectionnez une ville</option>
                  {VILLES_BENIN.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <CarteLocalisation
                ville={etab.ville}
                latitude={etab.latitude}
                longitude={etab.longitude}
                onChange={(lat, lng) => { setE('latitude', lat); setE('longitude', lng) }}
              />

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">
                  Lien vidéo YouTube <span className="text-gray-400 font-normal">(facultatif)</span>
                </label>
                <div className="relative">
                  <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="url" value={etab.videoYoutube} onChange={e => setE('videoYoutube', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>

              {/* Politique d'annulation */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Politique d'annulation</p>
                  <p className="text-xs text-amber-700 mt-0.5">Ces taux seront appliqués automatiquement par la plateforme.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1.5">% frais d'annulation *</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" value={etab.tauxAnnulation}
                        onChange={e => setE('tauxAnnulation', Math.min(100, Math.max(0, e.target.value)))}
                        placeholder="Ex : 20"
                        className="w-full border border-gray-200 rounded-xl pl-4 pr-8 py-3 text-sm outline-none focus:border-blue-400 bg-white" />
                      <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1.5">% modification à la baisse *</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" value={etab.tauxModification}
                        onChange={e => setE('tauxModification', Math.min(100, Math.max(0, e.target.value)))}
                        placeholder="Ex : 10"
                        className="w-full border border-gray-200 rounded-xl pl-4 pr-8 py-3 text-sm outline-none focus:border-blue-400 bg-white" />
                      <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="col-span-full bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  La plateforme accorde automatiquement 2h après le paiement pour annuler ou modifier gratuitement. Au-delà, vos taux ci-dessus s'appliquent.
                </div>
              </div>
            </div>
          )}

          {/* ===== ÉTAPE 3 — PHOTOS ===== */}
          {etape === 3 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="font-black text-gray-900 text-lg">Photos de l'établissement</h2>
                <p className="text-xs text-gray-400 mt-0.5">Au moins 1 photo · Maximum 5 · Les meilleures photos augmentent les réservations</p>
              </div>

              <div
                onClick={() => photoRef.current.click()}
                className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
              >
                <Upload size={28} className="text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
                <p className="font-semibold text-gray-600 text-sm">Cliquez pour ajouter des photos</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG · Sélection multiple possible</p>
                <input ref={photoRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => ajouterPhotos(e.target.files)} />
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${photos.length >= 1 ? 'text-green-600' : 'text-amber-600'}`}>
                  {photos.length}/5 photo{photos.length > 1 ? 's' : ''}
                </span>
                {photos.length >= 5 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    Maximum atteint
                  </span>
                )}
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPhotos(prev => prev.filter((_, idx) => idx !== i)) }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <X size={12} className="text-white" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                          Principale
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ÉTAPE 4 — DOCUMENTS LÉGAUX ===== */}
          {etape === 4 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="font-black text-gray-900 text-lg">Documents légaux</h2>
                <p className="text-xs text-gray-400 mt-0.5">Nécessaires pour valider votre établissement</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                Ces documents sont confidentiels et utilisés uniquement pour vérifier l'identité du propriétaire et la légalité de l'établissement.
              </div>

              {/* Registre de commerce */}
              <div
                onClick={() => registreRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all ${
                  docs.registre ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${docs.registre ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <FileText size={22} className={docs.registre ? 'text-green-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">Registre de commerce / IFU *</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {docs.registre ? docs.registre.name : 'PDF, JPG ou PNG · Cliquez pour charger'}
                    </p>
                  </div>
                  {docs.registre
                    ? <CheckCircle size={20} className="text-green-500 shrink-0" />
                    : <Upload size={16} className="text-gray-400 shrink-0" />
                  }
                </div>
                <input ref={registreRef} type="file" accept=".pdf,image/*" className="hidden"
                  onChange={e => {
                    const fichier = e.target.files[0]
                    if (!fichier) return
                    if (!extensionAutorisee(fichier)) {
                      setErreur('Veuillez sélectionner un fichier au format PDF, JPG, PNG ou WEBP.')
                      e.target.value = ''
                      return
                    }
                    setErreur('')
                    setDocs(d => ({ ...d, registre: fichier }))
                  }} />
              </div>

              {/* Pièce d'identité */}
              <div
                onClick={() => identiteRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all ${
                  docs.identite ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${docs.identite ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <User size={22} className={docs.identite ? 'text-green-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">Pièce d'identité du propriétaire *</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {docs.identite ? docs.identite.name : 'CNI, Passeport · PDF, JPG ou PNG'}
                    </p>
                  </div>
                  {docs.identite
                    ? <CheckCircle size={20} className="text-green-500 shrink-0" />
                    : <Upload size={16} className="text-gray-400 shrink-0" />
                  }
                </div>
                <input ref={identiteRef} type="file" accept=".pdf,image/*" className="hidden"
                  onChange={e => {
                    const fichier = e.target.files[0]
                    if (!fichier) return
                    if (!extensionAutorisee(fichier)) {
                      setErreur('Veuillez sélectionner un fichier au format PDF, JPG, PNG ou WEBP.')
                      e.target.value = ''
                      return
                    }
                    setErreur('')
                    setDocs(d => ({ ...d, identite: fichier }))
                  }} />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 flex items-start gap-2">
                <Clock size={14} className="shrink-0 mt-0.5 text-gray-400" />
                Après soumission, notre équipe examinera votre dossier sous <strong className="text-gray-700">24 à 48h</strong>. Vous serez notifié par email et SMS.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-7">
            {etape > 1 && (
              <button
                type="button"
                onClick={retour}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-5 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} /> Retour
              </button>
            )}
            <button
              type="button"
              onClick={suivant}
              disabled={chargement}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              {chargement ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Envoi en cours...
                </>
              ) : etape < 4 ? (
                <>Continuer <ChevronRight size={16} /></>
              ) : (
                <>Soumettre mon dossier <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 space-x-3">
          <Link to="/" className="hover:text-blue-600 transition-colors">← Retour à l'accueil</Link>
          <span>·</span>
          <Link to="/connexion" className="hover:text-blue-600 transition-colors">Déjà inscrit ? Se connecter</Link>
        </p>
      </div>
    </div>
    </Layout>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
  ChevronLeft, MapPin, Phone, Mail, Clock,
  MessageCircle, Paperclip, CheckCircle,
  AlertTriangle, Loader2, Send,
} from 'lucide-react'

const TYPES_UTILISATEUR = [
  { value: '', label: 'Sélectionner votre profil...' },
  { value: 'client', label: 'Client / Voyageur' },
  { value: 'hotelier', label: 'Hôtelier / Gestionnaire' },
  { value: 'partenaire', label: 'Partenaire commercial' },
  { value: 'autre', label: 'Autre' },
]

const SUJETS = [
  { value: '', label: 'Sélectionner un sujet...' },
  { value: 'reservation', label: 'Problème de réservation' },
  { value: 'paiement', label: 'Problème de paiement / remboursement' },
  { value: 'compte', label: 'Mon compte / connexion' },
  { value: 'hotel', label: "Signalement d'un hôtel" },
  { value: 'partenariat', label: 'Demande de partenariat' },
  { value: 'technique', label: 'Bug technique' },
  { value: 'autre', label: 'Autre demande' },
]

const COORDONNEES = [
  { Icon: MapPin,  titre: 'Adresse',   valeur: 'Quartier Cadjèhoun, Cotonou\nRépublique du Bénin' },
  { Icon: Phone,   titre: 'Téléphone', valeur: '+229 64 61 38 61' },
  { Icon: Mail,    titre: 'Email',     valeur: 'contact@pharosbenin.bj' },
  { Icon: Clock,   titre: 'Horaires',  valeur: 'Lun – Ven : 8h00 – 18h00\nSam : 9h00 – 13h00' },
]

const INITIAL = {
  nom: '', telephone: '', email: '',
  type: '', sujet: '', urgence: 'normal',
  message: '', fichier: null,
}

export default function ContactPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [erreurs, setErreurs] = useState({})
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState(false)
  const [emailSucces] = useState('')

  const set = (champ, val) => {
    setForm(prev => ({ ...prev, [champ]: val }))
    if (erreurs[champ]) setErreurs(prev => ({ ...prev, [champ]: '' }))
  }

  const valider = () => {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Nom requis'
    if (!form.telephone.trim()) e.telephone = 'Téléphone requis'
    if (!form.email.trim()) e.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.type) e.type = 'Veuillez sélectionner votre profil'
    if (!form.sujet) e.sujet = 'Veuillez sélectionner un sujet'
    if (!form.message.trim()) e.message = 'Message requis'
    else if (form.message.trim().length < 20) e.message = 'Message trop court (20 caractères min.)'
    return e
  }

  const soumettre = async (e) => {
    e.preventDefault()
    const e2 = valider()
    if (Object.keys(e2).length > 0) { setErreurs(e2); return }
    setEnvoi(true)
    try {
      await api.post('/contacts/', {
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        type_profil: form.type,
        sujet: form.sujet,
        urgence: form.urgence,
        message: form.message,
      })
      setSucces(true)
      setForm(INITIAL)
    } catch {
      setErreurs({ general: 'Erreur lors de l\'envoi. Veuillez réessayer.' })
    } finally {
      setEnvoi(false)
    }
  }

  const champCls = (err) =>
    `w-full bg-[#1F2937] border ${err ? 'border-red-500' : 'border-white/10'} text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F57C2B] transition-colors`

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-200 via-pink-1OO  to-orange-400 font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0D1B40] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors mr-2"
            >
              <ChevronLeft size={16} />
              Retour
            </button>
            <div className="h-5 w-px bg-white/20" />
            <span className="text-xl font-black tracking-tight select-none ml-2">
              <span className="text-[#F57C2B]">PHAROS</span>
              <span className="text-white"> BÉNIN</span>
            </span>
          </div>
          <span className="text-white/50 text-sm hidden sm:block">Support client</span>
        </div>
      </nav>

      {/* ── Header ── */}
      <div className="bg-[#0D1B40] py-12 px-4 text-center">
        <span className="inline-block bg-[#F57C2B]/20 text-[#F57C2B] text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
          Contact
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Comment pouvons-nous vous aider ?
        </h1>
        <p className="text-white/50 max-w-lg mx-auto text-sm">
          Notre équipe support est disponible pour répondre à toutes vos questions sous 24h.
        </p>
      </div>

      {/* ── Contenu principal ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Colonne gauche ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Carte coordonnées */}
            <div className="bg-[#0D1B40] rounded-3xl p-7 text-white">
              <h2 className="font-black text-lg mb-6">Nos Coordonnées</h2>
              <div className="space-y-5">
                {COORDONNEES.map(({ Icon, titre, valeur }, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-[#F57C2B]/20 rounded-xl flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[#F57C2B]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{titre}</p>
                      <p className="text-white/60 text-sm mt-0.5 whitespace-pre-line">{valeur}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carte WhatsApp */}
            <div className="bg-[#075E54] rounded-3xl p-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#25D366] rounded-2xl flex items-center justify-center">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-base">WhatsApp Direct</p>
                  <p className="text-white/60 text-xs">Réponse rapide garantie</p>
                </div>
              </div>
              <p className="text-white/70 text-sm mb-4">
                Pour une assistance immédiate, contactez-nous directement sur WhatsApp.
                Notre équipe répond en moins d'1 heure en heures ouvrables.
              </p>
              <a
                href="https://wa.me/22964613861"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20c55a] text-white font-bold text-center py-3 rounded-xl text-sm transition-colors"
              >
                <MessageCircle size={16} />
                Ouvrir WhatsApp
              </a>
            </div>

          </div>

          {/* ── Formulaire ── */}
          <div className="lg:col-span-3">
            <form onSubmit={soumettre} className="bg-[#111827] rounded-3xl p-7 sm:p-8 text-white">
              <div className="mb-7">
                <h2 className="font-black text-xl mb-1">Centre de support client</h2>
                <p className="text-white/40 text-sm">Remplissez ce formulaire et nous vous recontacterons sous 24h.</p>
              </div>

              <div className="space-y-5">

                {/* Nom + Téléphone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">
                      Nom complet <span className="text-[#F57C2B]">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={e => set('nom', e.target.value)}
                      placeholder="Jean Kouassi"
                      className={champCls(erreurs.nom)}
                    />
                    {erreurs.nom && <p className="text-red-400 text-xs mt-1">{erreurs.nom}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">
                      Téléphone <span className="text-[#F57C2B]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={e => set('telephone', e.target.value)}
                      placeholder="+229 XX XX XX XX"
                      className={champCls(erreurs.telephone)}
                    />
                    {erreurs.telephone && <p className="text-red-400 text-xs mt-1">{erreurs.telephone}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">
                    Adresse email <span className="text-[#F57C2B]">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="jean@exemple.com"
                    className={champCls(erreurs.email)}
                  />
                  {erreurs.email && <p className="text-red-400 text-xs mt-1">{erreurs.email}</p>}
                </div>

                {/* Type + Sujet */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">
                      Type d'utilisateur <span className="text-[#F57C2B]">*</span>
                    </label>
                    <select value={form.type} onChange={e => set('type', e.target.value)} className={champCls(erreurs.type)}>
                      {TYPES_UTILISATEUR.map(o => (
                        <option key={o.value} value={o.value} className="bg-[#1F2937]">{o.label}</option>
                      ))}
                    </select>
                    {erreurs.type && <p className="text-red-400 text-xs mt-1">{erreurs.type}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">
                      Sujet <span className="text-[#F57C2B]">*</span>
                    </label>
                    <select value={form.sujet} onChange={e => set('sujet', e.target.value)} className={champCls(erreurs.sujet)}>
                      {SUJETS.map(o => (
                        <option key={o.value} value={o.value} className="bg-[#1F2937]">{o.label}</option>
                      ))}
                    </select>
                    {erreurs.sujet && <p className="text-red-400 text-xs mt-1">{erreurs.sujet}</p>}
                  </div>
                </div>

                {/* Niveau d'urgence */}
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2 block">
                    Niveau d'urgence
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => set('urgence', 'normal')}
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                        form.urgence === 'normal'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      <CheckCircle size={15} className={form.urgence === 'normal' ? 'text-white' : 'text-white/30'} />
                      Assistance normale
                    </button>
                    <button
                      type="button"
                      onClick={() => set('urgence', 'critique')}
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                        form.urgence === 'critique'
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      <AlertTriangle size={15} className={form.urgence === 'critique' ? 'text-white' : 'text-white/30'} />
                      Urgence critique
                    </button>
                  </div>
                  {form.urgence === 'critique' && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Les urgences critiques sont traitées en priorité dans l'heure.
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">
                    Message <span className="text-[#F57C2B]">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    rows={5}
                    placeholder="Décrivez votre problème ou votre demande en détail..."
                    className={`${champCls(erreurs.message)} resize-none`}
                  />
                  <div className="flex justify-between mt-1">
                    {erreurs.message
                      ? <p className="text-red-400 text-xs">{erreurs.message}</p>
                      : <span />
                    }
                    <p className="text-white/20 text-xs">{form.message.length} car.</p>
                  </div>
                </div>

                {/* Pièce jointe */}
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">
                    Pièce jointe <span className="text-white/30 font-normal normal-case">(facultatif)</span>
                  </label>
                  <label className="flex items-center gap-3 w-full bg-[#1F2937] border border-dashed border-white/20 hover:border-[#F57C2B]/50 rounded-xl px-4 py-4 cursor-pointer transition-colors group">
                    <div className="w-9 h-9 bg-[#F57C2B]/10 group-hover:bg-[#F57C2B]/20 rounded-xl flex items-center justify-center transition-colors shrink-0">
                      <Paperclip size={18} className="text-[#F57C2B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {form.fichier
                        ? <p className="text-white text-sm font-medium truncate">{form.fichier.name}</p>
                        : <p className="text-white/30 text-sm">Cliquez pour sélectionner un fichier</p>
                      }
                      <p className="text-white/20 text-xs mt-0.5">PNG, JPG, PDF — max 5 Mo</p>
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      className="hidden"
                      onChange={e => set('fichier', e.target.files[0] || null)}
                    />
                  </label>
                </div>

                {/* Erreur générale */}
                {erreurs.general && (
                  <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{erreurs.general}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={envoi}
                  className="w-full py-4 rounded-xl font-black text-white text-sm bg-gradient-to-r from-[#F57C2B] to-[#e91e8c] hover:from-[#e06a1a] hover:to-[#d01878] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
                >
                  {envoi
                    ? <><Loader2 size={16} className="animate-spin" /> Transmission en cours...</>
                    : <><Send size={15} /> Transmettre au service support</>
                  }
                </button>

              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Modal succès ── */}
      {succes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-black text-[#0D1B40] mb-2">Message envoyé !</h3>
            <p className="text-gray-500 text-sm mb-2">
              Votre demande a été transmise à notre équipe de support.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Nous vous répondrons sous 24 heures.
              {form.urgence === 'critique' && ' Les urgences critiques sont traitées en priorité.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSucces(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => { setSucces(false); navigate('/') }}
                className="flex-1 bg-[#0D1B40] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#162456] transition-colors"
              >
                Accueil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="bg-[#0D1B40] border-t border-white/10 py-10 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-black">
              <span className="text-[#F57C2B]">PHAROS</span>
              <span className="text-white"> BÉNIN</span>
            </p>
            <p className="text-white/40 text-xs mt-1">Le Phare de l'Hospitalité Béninoise</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: 'Facebook', icon: <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
              { label: 'Instagram', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={16} height={16}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg> },
              { label: 'X', icon: <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            ].map(({ label, icon }) => (
              <button key={label} aria-label={label}
                className="w-9 h-9 bg-white/10 hover:bg-[#F57C2B] rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                {icon}
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs">© 2026 PHAROS BÉNIN. Tous droits réservés.</p>
        </div>
      </footer>

    </div>
  )
}

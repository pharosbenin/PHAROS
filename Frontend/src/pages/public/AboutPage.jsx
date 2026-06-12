import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Users, BellRing, Building2, MapPin, ShieldCheck,
  Star, Bell, Map, Smartphone, Target,
} from 'lucide-react'
import api from '../../services/api'

const BACKEND_URL = 'http://localhost:8000'
function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BACKEND_URL + path
}

const FEATURES = [
  { Icon: BellRing,    titre: 'Réservation en ligne',    desc: "Réservez votre chambre en quelques clics, 24h/24 et 7j/7, depuis n'importe quel appareil.", color: 'text-[#F57C2B] bg-[#F57C2B]/10' },
  { Icon: Building2,  titre: 'Gestion hôtelière',        desc: 'Tableau de bord complet pour les hôteliers : chambres, réservations, revenus et statistiques.', color: 'text-blue-600 bg-blue-50' },
  { Icon: MapPin,     titre: 'Géolocalisation',           desc: 'Trouvez les hôtels près de vous grâce à la carte interactive et aux filtres de localisation.', color: 'text-emerald-600 bg-emerald-50' },
  { Icon: Bell,       titre: 'Notifications',             desc: 'Restez informé en temps réel : confirmations, rappels de séjour et mises à jour importantes.', color: 'text-purple-600 bg-purple-50' },
  { Icon: ShieldCheck,titre: 'Paiements Mobile Money',   desc: 'Paiements sécurisés via MTN Mobile Money et Moov Money. Fonds protégés par escrow PHAROS.', color: 'text-[#F57C2B] bg-[#F57C2B]/10' },
  { Icon: Star,       titre: 'Évaluations vérifiées',    desc: "Système d'avis authentiques après séjour confirmé pour des décisions éclairées.", color: 'text-amber-500 bg-amber-50' },
]

const CAROUSEL_FALLBACK = [
  { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop', label: 'Hôtel PHAROS' },
  { src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop', label: 'Établissement partenaire' },
  { src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop', label: 'Hôtel de qualité' },
]

const STATS = [
  { valeur: '200+',   label: 'Hôtels partenaires' },
  { valeur: '5 000+', label: 'Réservations effectuées' },
  { valeur: '98%',    label: 'Taux de satisfaction' },
]

const HISTOIRE = [
  { Icon: Map,        titre: 'Plus de 12 villes couvertes',   desc: 'Des hôtels dans toutes les grandes villes du Bénin' },
  { Icon: Smartphone, titre: '100% Mobile Money',     desc: 'MTN & Moov — paiements adaptés au contexte béninois' },
  { Icon: Target,     titre: "2 plans d'abonnement",  desc: 'Freemium et Pro  pour les hôteliers' },
]

export default function AboutPage() {
  const navigate = useNavigate()
  const [slideActif, setSlideActif] = useState(0)
  const [carouselPhotos, setCarouselPhotos] = useState(CAROUSEL_FALLBACK)

  useEffect(() => {
    api.get('/hotels/')
      .then(res => {
        const avecPhoto = (res.data || []).filter(h => h.photo_principale)
        if (avecPhoto.length >= 2) {
          setCarouselPhotos(avecPhoto.map(h => ({
            id: h.id,
            src: mediaUrl(h.photo_principale),
            label: h.nom,
          })))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideActif(prev => (prev + 1) % carouselPhotos.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [carouselPhotos.length])

  return (
    <div className="min-h-screen bg-[#F4F6FB] font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0B1446] shadow-xl">
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
          <span className="text-white/50 text-sm hidden sm:block">Le Phare de l'Hospitalité Béninoise</span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#0D1B40] py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-[#F57C2B]/20 text-[#F57C2B] text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
              À propos de nous
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
              Le phare de<br />
              <span className="text-[#F57C2B]">l'hospitalité</span><br />
              béninoise
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
              PHAROS BÉNIN est la première plateforme de réservation hôtelière dédiée au Bénin.
              Nous connectons les voyageurs aux meilleurs établissements du pays, du simple lodge
              à l'hôtel de luxe, avec des paiements 100% Mobile Money.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/recherche')}
                className="bg-[#F57C2B] hover:bg-[#e06a1a] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Découvrir les hôtels
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Nous contacter
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden aspect-[4/3] relative">
              {carouselPhotos.map((photo, i) => (
                <img
                  key={i}
                  src={photo.src}
                  alt={photo.label}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                  style={{ opacity: i === slideActif ? 1 : 0 }}
                />
              ))}
              {/* Dégradé bas */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              {/* Badge #1 */}
              <div className="absolute top-4 left-4 bg-[#F57C2B] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                #1 au Bénin
              </div>
              {/* Badge hôtels partenaires */}
              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
                <p className="text-white font-bold text-lg">200+</p>
                <p className="text-white/60 text-xs">Hôtels partenaires</p>
              </div>
              {/* Nom de l'hôtel actif */}
              <p className="absolute bottom-4 left-4 text-white/70 text-xs font-medium">
                {carouselPhotos[slideActif].label}
              </p>
              {/* Points indicateurs */}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2">
                {carouselPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideActif(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === slideActif ? 'bg-[#F57C2B] w-5' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-16 px-4 bg-[#F4F6FB]">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 sm:p-10 flex gap-6 items-start border-l-4 border-[#F57C2B] overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#F57C2B]/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
            <div className="w-16 h-16 bg-[#F57C2B] rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0D1B40] mb-3">Notre Mission</h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Rendre le voyage au Bénin plus simple, plus sûr et plus accessible. Nous mettons en relation
                les voyageurs avec des hôtels de qualité vérifiée, en garantissant des paiements sécurisés
                grâce à notre système d'escrow et des avis authentiques post-séjour.
                Chaque réservation est une promesse de confiance entre le voyageur et l'hôtelier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section className="py-20 px-4 bg-[#F4F6FB]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
          
            <h2 className="text-4xl font-black text-[#0D1B40]">Nos fonctionnalités principales</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto text-base">
              Tout ce dont vous avez besoin pour réserver ou gérer un hôtel au Bénin.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ Icon, titre, desc, color }, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-7 shadow-xl border-b-4 border-[#F57C2B]"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md ${color}`}>
                  <Icon size={28} />
                </div>
                <h3 className="font-black text-[#0D1B40] text-lg mb-2">{titre}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chiffres clés ── */}
      <section className="py-16 px-4 bg-[#0D1B40]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white">PHAROS en chiffres</h2>
            <p className="text-white/50 mt-2">Une plateforme qui grandit avec le Bénin</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STATS.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-5xl font-black text-[#F57C2B] mb-2">{s.valeur}</p>
                <p className="text-white/60 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Histoire ── */}
      <section className="py-16 px-4 bg-[#F4F6FB]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
          
            <h2 className="text-3xl font-black text-[#0D1B40] mb-5">
              Née d'un besoin réel,<br />construite pour le Bénin
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              PHAROS BÉNIN est née de la frustration des voyageurs qui peinaient à trouver et
              réserver des hôtels fiables au Bénin. Pas de plateforme locale, pas de paiements
              adaptés, pas de garanties.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Aujourd'hui, nous couvrons les principales villes du Bénin — de Cotonou à Parakou,
              en passant par Abomey-Calavi, Bohicon et Porto-Novo — avec une solution pensée
              pour la réalité du terrain : Mobile Money, QR Code à l'arrivée, escrow sécurisé.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0D1B40] flex items-center justify-center text-white font-black text-sm">P</div>
              <div>
                <p className="font-bold text-[#0D1B40] text-sm">Équipe PHAROS BÉNIN</p>
                <p className="text-gray-400 text-xs">Parakou, République du Bénin</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0D1B40] rounded-3xl p-8 space-y-6">
            {HISTOIRE.map(({ Icon, titre, desc }, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#F57C2B]/20 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[#F57C2B]" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{titre}</p>
                  <p className="text-white/50 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0D1B40] border-t border-white/10 py-10 px-4">
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

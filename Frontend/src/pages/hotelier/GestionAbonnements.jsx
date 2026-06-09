import { useState, useEffect } from 'react'
import { Check, Zap, TrendingUp, Star, Image, BarChart2, MessageSquare, Tag, Megaphone, Crown, Lock, Loader, Info, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import SidebarHotelier from '../../components/common/SidebarHotelier'
import api from '../../services/api'

const ICONES_AVANTAGES = [Image, Crown, TrendingUp, BarChart2, MessageSquare, Tag, Megaphone, Star, Zap]

export default function GestionAbonnements() {
  const [abonnementInfo, setAbonnementInfo] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [confirmModal, setConfirmModal] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  const charger = () => {
    api.get('/gestionnaire/abonnement/')
      .then(res => setAbonnementInfo(res.data))
      .catch(() => toast.error('Erreur lors du chargement de l\'abonnement'))
      .finally(() => setChargement(false))
  }

  useEffect(() => { charger() }, [])

  const estPro = abonnementInfo?.type_actuel === 'pro'
  const demandeEnCours = abonnementInfo?.demande_en_cours === true
  const tauxFreemium = 3
  const tauxPro = 5

  const demanderUpgrade = async () => {
    setUpgradeLoading(true)
    try {
      await api.post('/gestionnaire/abonnement/upgrade/')
      toast.success('Demande envoyée ! L\'administrateur va traiter votre demande.')
      setConfirmModal(false)
      charger()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'envoi de la demande')
    } finally {
      setUpgradeLoading(false)
    }
  }

  if (chargement) return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 flex items-center justify-center"><Loader size={32} className="animate-spin text-blue-500" /></div>
    </div>
  )

  const avantages = abonnementInfo?.avantages_pro || []

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 min-w-0 p-6 lg:p-8 max-w-4xl">

        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Abonnement</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez votre plan et accédez aux fonctionnalités Pro</p>
        </div>

        {/* Bannière demande en cours */}
        {demandeEnCours && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Demande de passage en Pro en cours de traitement</p>
              <p className="text-amber-700 text-xs mt-1">Votre demande a été transmise à l'administrateur. Vous serez notifié dès qu'elle sera traitée.</p>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">

          {/* Freemium */}
          <div className={`bg-white rounded-2xl border-2 p-6 ${!estPro ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-gray-900 text-xl">FREEMIUM</h2>
              {!estPro && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Plan actuel</span>}
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">Gratuit</p>
            <p className="text-sm text-gray-500 mb-4">Commission PHAROS : <strong className="text-gray-700">{tauxFreemium}%</strong> par réservation</p>
            <ul className="space-y-2 text-sm text-gray-600">
              {['Création d\'établissement', 'Gestion des chambres', 'Réception des réservations', 'Tableau de bord basique', '5 photos maximum', 'Affichage normal dans les résultats'].map(item => (
                <li key={item} className="flex items-center gap-2"><Check size={14} className="text-gray-400 shrink-0" /> {item}</li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div className={`rounded-2xl border-2 p-6 relative overflow-hidden ${estPro ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-amber-300 bg-white'}`}>
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">RECOMMANDÉ</div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown size={20} className="text-amber-500" />
                <h2 className="font-black text-gray-900 text-xl">PRO</h2>
              </div>
              {estPro && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">Plan actuel ✓</span>}
              {demandeEnCours && !estPro && <span className="bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Clock size={11} /> En attente</span>}
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">Gratuit</p>
            <p className="text-sm text-gray-500 mb-4">Commission PHAROS : <strong className="text-gray-700">{tauxPro}%</strong> par réservation <span className="text-gray-400">(au lieu de {tauxFreemium}%)</span></p>
            <ul className="space-y-2 text-sm text-gray-700 mb-5">
              {["Jusqu'à 25 photos", 'Badge Partenaire Pro', 'Priorité maximale dans les résultats', 'Statistiques avancées', 'Réponse aux avis', 'Promotions & offres spéciales', 'Bannière sur la page d\'accueil', 'Mise en avant pendant événements nationaux', 'Support prioritaire'].map(item => (
                <li key={item} className="flex items-center gap-2"><Check size={14} className="text-amber-600 shrink-0" /> {item}</li>
              ))}
            </ul>

            {estPro ? (
              <div className="w-full bg-green-100 text-green-700 font-bold py-3 rounded-xl text-center text-sm flex items-center justify-center gap-2">
                <Check size={16} /> Fonctionnalité active
              </div>
            ) : demandeEnCours ? (
              <div className="w-full bg-amber-100 text-amber-700 font-bold py-3 rounded-xl text-center text-sm flex items-center justify-center gap-2">
                <Clock size={16} /> Demande en cours de traitement
              </div>
            ) : (
              <button onClick={() => setConfirmModal(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-xl transition-all text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <Crown size={18} /> Passer en PRO maintenant
              </button>
            )}
          </div>
        </div>

        {/* Avantages Pro depuis le backend */}
        {avantages.length > 0 && (
          <>
            <h2 className="font-black text-gray-900 text-lg mb-4">
              <span className="flex items-center gap-2">
                {estPro
                  ? <><CheckCircle2 size={20} className="text-green-600" /> Vos fonctionnalités Pro débloquées</>
                  : <><Lock size={20} className="text-gray-500" /> Fonctionnalités Pro disponibles</>
                }
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {avantages.map((av, i) => {
                const Icone = ICONES_AVANTAGES[i % ICONES_AVANTAGES.length]
                return (
                  <div key={i} className={`relative rounded-2xl border p-5 transition-all ${!estPro ? 'opacity-55 border-gray-200 bg-gray-50' : 'border-green-200 bg-green-50'}`}>
                    {!estPro && <div className="absolute top-3 right-3"><Lock size={14} className="text-gray-400" /></div>}
                    {estPro && <div className="absolute top-3 right-3"><Check size={14} className="text-green-600" /></div>}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${estPro ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                      <Icone size={18} />
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{av}</p>
                    {!estPro && !demandeEnCours && (
                      <button onClick={() => setConfirmModal(true)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg transition-colors w-full mt-2">
                        Passer en Pro
                      </button>
                    )}
                    {!estPro && demandeEnCours && (
                      <p className="text-xs text-amber-600 font-semibold mt-2 flex items-center gap-1"><Clock size={11} /> Demande en attente</p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Info commission */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-2">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Info size={16} className="text-blue-600 shrink-0" /> Comment fonctionne la commission ?</h3>
          <p className="text-sm text-blue-700 leading-relaxed">
            La commission ({estPro ? `${tauxPro}%` : `${tauxFreemium}%`}) est prélevée automatiquement par PHAROS sur chaque réservation confirmée.
            Elle est déduite du montant transféré après validation du séjour par le client et l'hôtel. Le reste vous est versé directement via Mobile Money.
          </p>
        </div>
      </div>

      {/* Modal confirmation demande upgrade */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Demande de passage en Pro</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Votre demande sera transmise à l'administrateur PHAROS. Une fois validée, votre commission passera de <strong>{tauxFreemium}%</strong> à <strong>{tauxPro}%</strong> et toutes les fonctionnalités Pro seront activées.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 space-y-2 text-sm text-amber-800">
              {["Jusqu'à 25 photos sur votre établissement", 'Badge Partenaire Pro visible par les clients', 'Priorité maximale dans les résultats de recherche', 'Statistiques avancées et support prioritaire'].map(item => (
                <div key={item} className="flex items-center gap-2"><Check size={13} className="text-amber-600 shrink-0" /> {item}</div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(false)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
                Annuler
              </button>
              <button onClick={demanderUpgrade} disabled={upgradeLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                {upgradeLoading ? <Loader size={16} className="animate-spin" /> : <Crown size={16} />}
                {upgradeLoading ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

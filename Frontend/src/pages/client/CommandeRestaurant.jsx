import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Utensils, Plus, Minus, ShoppingBag, Loader2,
  CheckCircle, AlertCircle, Info, Send, Clock, ChefHat, Truck, X
} from 'lucide-react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'

const CATEGORIES_LABELS = {
  entrees: 'Entrées',
  plats: 'Plats principaux',
  grillades: 'Grillades',
  poissons: 'Poissons & Fruits de mer',
  vegetarien: 'Végétarien',
  desserts: 'Desserts',
  boissons: 'Boissons',
  petit_dejeuner: 'Petit-déjeuner',
}

const STATUT_COMMANDE = {
  en_attente:     { label: 'En attente', icon: Clock,      couleur: 'bg-gray-100 text-gray-600' },
  en_preparation: { label: 'En préparation', icon: ChefHat, couleur: 'bg-amber-100 text-amber-700' },
  prete:          { label: 'Prête', icon: CheckCircle,     couleur: 'bg-green-100 text-green-700' },
  livree:         { label: 'Livrée', icon: Truck,          couleur: 'bg-blue-100 text-blue-700' },
  annulee:        { label: 'Annulée', icon: X,             couleur: 'bg-red-100 text-red-600' },
}

export default function CommandeRestaurant() {
  const { numero } = useParams()
  const navigate = useNavigate()

  const [menu, setMenu] = useState(null)
  const [commandes, setCommandes] = useState([])
  const [panier, setPanier] = useState({})   // { plat_id: quantite }
  const [notes, setNotes] = useState('')
  const [onglet, setOnglet] = useState('menu')  // 'menu' | 'commandes'
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [succes, setSucces] = useState(false)
  const [hotelId, setHotelId] = useState(null)

  useEffect(() => {
    async function charger() {
      try {
        // Récupérer le numéro d'hôtel depuis la réservation
        const resResa = await api.get(`/reservations/${numero}/`)
        setHotelId(resResa.data.hotel_id)

        const [menuRes, commandesRes] = await Promise.all([
          api.get(`/hotels/${resResa.data.hotel_id}/menu/`),
          api.get(`/reservations/${numero}/commander/`),
        ])
        setMenu(menuRes.data)
        setCommandes(commandesRes.data)
      } catch {
        setErreur('Impossible de charger le menu.')
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [numero])

  const modifier = (platId, delta) => {
    setPanier(prev => {
      const nv = (prev[platId] || 0) + delta
      if (nv <= 0) {
        const { [platId]: _, ...reste } = prev
        return reste
      }
      return { ...prev, [platId]: nv }
    })
  }

  const totalPanier = menu?.plats?.reduce((sum, p) => sum + (panier[p.id] || 0) * parseFloat(p.prix), 0) ?? 0
  const nbArticles = Object.values(panier).reduce((s, q) => s + q, 0)

  const commander = async () => {
    if (nbArticles === 0) return
    setEnvoi(true)
    setErreur(null)
    try {
      const lignes = Object.entries(panier).map(([plat_id, quantite]) => ({
        plat_id: parseInt(plat_id),
        quantite,
      }))
      const res = await api.post(`/reservations/${numero}/commander/`, { lignes, notes })
      setCommandes(prev => [res.data, ...prev])
      setPanier({})
      setNotes('')
      setSucces(true)
      setOnglet('commandes')
      setTimeout(() => setSucces(false), 4000)
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Erreur lors de la commande.')
    } finally {
      setEnvoi(false)
    }
  }

  // Grouper les plats par catégorie
  const parCategorie = (menu?.plats || []).reduce((acc, plat) => {
    const cat = plat.categorie
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(plat)
    return acc
  }, {})

  if (chargement) return (
    <Layout>
      <div className="flex items-center justify-center py-24">
        <Loader2 size={40} className="animate-spin text-blue-500" />
      </div>
    </Layout>
  )

  if (!menu?.a_restauration) return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Utensils size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pas de restauration</h2>
        <p className="text-gray-500 text-sm mb-6">Cet hôtel ne propose pas de service de restauration en chambre.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm hover:underline">Retour</button>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ChevronLeft size={18} /> Retour
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Utensils size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Commander au restaurant</h1>
            <p className="text-sm text-gray-400">{menu.hotel_nom}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-2 text-sm text-blue-700">
          <Info size={15} className="shrink-0 mt-0.5" />
          Le paiement se règle directement à l'hôtel. Cette commande est envoyée à la cuisine.
        </div>

        {/* Onglets */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: 'menu', label: 'Menu' },
            { id: 'commandes', label: `Mes commandes${commandes.length ? ` (${commandes.length})` : ''}` },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${onglet === o.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {o.label}
            </button>
          ))}
        </div>

        {/* ---- ONGLET MENU ---- */}
        {onglet === 'menu' && (
          <div className="space-y-6">
            {Object.entries(parCategorie).map(([cat, plats]) => (
              <div key={cat}>
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">
                  {CATEGORIES_LABELS[cat] || cat}
                </h2>
                <div className="space-y-2">
                  {plats.map(plat => (
                    <div key={plat.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{plat.nom}</p>
                        {plat.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{plat.description}</p>}
                        <p className="text-sm font-bold text-orange-600 mt-1">{parseFloat(plat.prix).toLocaleString()} FCFA</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {panier[plat.id] ? (
                          <>
                            <button onClick={() => modifier(plat.id, -1)}
                              className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50">
                              <Minus size={13} />
                            </button>
                            <span className="text-sm font-bold w-5 text-center">{panier[plat.id]}</span>
                            <button onClick={() => modifier(plat.id, 1)}
                              className="w-7 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center">
                              <Plus size={13} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => modifier(plat.id, 1)}
                            className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center">
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Récap + notes + bouton commander */}
            {nbArticles > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm sticky bottom-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-orange-500" />
                    <span className="font-semibold text-gray-900 text-sm">{nbArticles} article{nbArticles > 1 ? 's' : ''}</span>
                  </div>
                  <span className="font-black text-orange-600">{totalPanier.toLocaleString()} FCFA</span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Instructions spéciales (allergies, cuisson, sans gluten…)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-orange-300 mb-3"
                />
                {erreur && (
                  <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2 mb-3">
                    <AlertCircle size={13} /> {erreur}
                  </div>
                )}
                <button onClick={commander} disabled={envoi}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  {envoi ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Envoyer la commande
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---- ONGLET COMMANDES ---- */}
        {onglet === 'commandes' && (
          <div className="space-y-4">
            {succes && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
                <CheckCircle size={15} /> Commande envoyée avec succès ! La cuisine a été notifiée.
              </div>
            )}
            {commandes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucune commande pour ce séjour.</p>
              </div>
            ) : (
              commandes.map(cmd => {
                const cfg = STATUT_COMMANDE[cmd.statut] || STATUT_COMMANDE.en_attente
                const Icon = cfg.icon
                return (
                  <div key={cmd.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">
                        {new Date(cmd.date_commande).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.couleur}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {cmd.lignes.map((l, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{l.quantite}× {l.nom_plat}</span>
                          <span className="text-gray-500">{(parseFloat(l.prix_unitaire) * l.quantite).toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                    {cmd.notes && <p className="text-xs text-gray-400 italic mb-3">"{cmd.notes}"</p>}
                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total estimé</span>
                      <span className="font-black text-orange-600">{parseFloat(cmd.montant_total).toLocaleString()} FCFA</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Paiement à régler directement à l'hôtel</p>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

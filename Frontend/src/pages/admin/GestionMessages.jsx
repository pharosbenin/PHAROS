import { useState } from 'react'
import SidebarAdmin from '../../components/common/SidebarAdmin'
import api from '../../services/api'
import usePolling from '../../hooks/usePolling'
import { Mail, MailOpen, AlertTriangle, Clock, User, Phone, Tag, ChevronDown, ChevronUp } from 'lucide-react'

const URGENCE_STYLE = {
  normal:   'bg-blue-100 text-blue-700',
  urgent:   'bg-amber-100 text-amber-700',
  critique: 'bg-red-100 text-red-700',
}

const SUJET_LABEL = {
  reservation: 'Réservation',
  paiement:    'Paiement',
  technique:   'Technique',
  partenariat: 'Partenariat',
  autre:       'Autre',
}

export default function GestionMessages() {
  const [messages, setMessages] = useState([])
  const [nonLus, setNonLus] = useState(0)
  const [chargement, setChargement] = useState(true)
  const [ouvert, setOuvert] = useState(null)
  const [filtre, setFiltre] = useState('tous')

  const charger = () => {
    setChargement(true)
    api.get('/admin/contacts/')
      .then(res => {
        setMessages(res.data.messages || [])
        setNonLus(res.data.non_lus || 0)
      })
      .finally(() => setChargement(false))
  }

  usePolling(charger, 30000)

  const marquerLu = async (id) => {
    await api.patch(`/admin/contacts/${id}/lire/`)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, lu: true } : m))
    setNonLus(prev => Math.max(0, prev - 1))
  }

  const ouvrir = (id) => {
    setOuvert(prev => prev === id ? null : id)
    const msg = messages.find(m => m.id === id)
    if (msg && !msg.lu) marquerLu(id)
  }

  const affichés = messages.filter(m => {
    if (filtre === 'non_lus') return !m.lu
    if (filtre === 'urgent') return m.urgence !== 'normal'
    return true
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />
      <main className="flex-1 p-6 lg:p-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Messages de contact</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {nonLus > 0 ? `${nonLus} message${nonLus > 1 ? 's' : ''} non lu${nonLus > 1 ? 's' : ''}` : 'Tous les messages sont lus'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 text-sm">
            {[
              { key: 'tous', label: 'Tous' },
              { key: 'non_lus', label: 'Non lus' },
              { key: 'urgent', label: 'Urgents' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltre(key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filtre === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : affichés.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Mail size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun message</p>
          </div>
        ) : (
          <div className="space-y-3">
            {affichés.map(msg => (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl border transition-all ${!msg.lu ? 'border-blue-200 shadow-md' : 'border-gray-100 shadow-sm'}`}
              >
                {/* En-tête de la carte */}
                <button
                  onClick={() => ouvrir(msg.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!msg.lu ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {msg.lu
                      ? <MailOpen size={18} className="text-gray-400" />
                      : <Mail size={18} className="text-blue-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-gray-900 ${!msg.lu ? 'text-blue-900' : ''}`}>{msg.nom}</span>
                      {!msg.lu && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NOUVEAU</span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${URGENCE_STYLE[msg.urgence]}`}>
                        {msg.urgence}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {SUJET_LABEL[msg.sujet] || msg.sujet} — {msg.message.substring(0, 80)}{msg.message.length > 80 ? '…' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs text-gray-400">{new Date(msg.date_envoi).toLocaleDateString('fr-FR')}</p>
                    <p className="text-xs text-gray-400">{new Date(msg.date_envoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {ouvert === msg.id ? <ChevronUp size={16} className="text-gray-400 ml-1" /> : <ChevronDown size={16} className="text-gray-400 ml-1" />}
                </button>

                {/* Détail dépliable */}
                {ouvert === msg.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={14} className="text-gray-400" />
                        <span>{msg.type_profil}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <a href={`mailto:${msg.email}`} className="text-blue-600 hover:underline truncate">{msg.email}</a>
                      </div>
                      {msg.telephone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400" />
                          <span>{msg.telephone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Tag size={14} className="text-gray-400" />
                        <span>{SUJET_LABEL[msg.sujet] || msg.sujet}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={`mailto:${msg.email}?subject=Réponse PHAROS BÉNIN`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        Répondre par email
                      </a>
                      {msg.urgence === 'critique' && (
                        <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                          <AlertTriangle size={14} />
                          Message critique — répondre en priorité
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs ml-auto">
                        <Clock size={12} />
                        {new Date(msg.date_envoi).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

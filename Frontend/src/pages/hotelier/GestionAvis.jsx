import { useState, useEffect } from 'react'
import { Star, MessageSquare, CheckCircle, Send, Loader } from 'lucide-react'
import SidebarHotelier from '../../components/common/SidebarHotelier'
import api from '../../services/api'

function EtoilesMoyenne({ note }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={14} className={n <= Math.round(note) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

export default function GestionAvis() {
  const [avis, setAvis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreNote, setFiltreNote] = useState(0)
  const [filtreStat, setFiltreStat] = useState('tous')
  const [reponseOuverte, setReponseOuverte] = useState(null)
  const [texteReponse, setTexteReponse] = useState('')
  const [enEnvoi, setEnEnvoi] = useState(false)

  useEffect(() => {
    api.get('/gestionnaire/avis/')
      .then(res => setAvis(res.data))
      .catch(err => console.error('Erreur chargement avis', err))
      .finally(() => setChargement(false))
  }, [])

  const avisFiltres = avis
    .filter(a => filtreNote === 0 || a.note === filtreNote)
    .filter(a => filtreStat === 'tous' || (filtreStat === 'repondus' ? !!a.reponse_gestionnaire : !a.reponse_gestionnaire))

  const noteMoyenne = avis.length ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1) : '0.0'

  const repartition = [5,4,3,2,1].map(n => ({
    note: n,
    count: avis.filter(a => a.note === n).length,
    pct: avis.length ? Math.round((avis.filter(a => a.note === n).length / avis.length) * 100) : 0,
  }))

  const envoyerReponse = async (id) => {
    if (!texteReponse.trim()) return
    setEnEnvoi(true)
    try {
      const res = await api.post(`/gestionnaire/avis/${id}/repondre/`, { reponse: texteReponse })
      setAvis(prev => prev.map(a => a.id === id ? res.data : a))
      setReponseOuverte(null)
      setTexteReponse('')
    } catch (err) {
      console.error('Erreur envoi réponse', err)
    } finally {
      setEnEnvoi(false)
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  if (chargement) return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 flex items-center justify-center"><Loader size={32} className="animate-spin text-blue-500" /></div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarHotelier />
      <div className="flex-1 min-w-0 p-6 lg:p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Avis clients</h1>
          <p className="text-gray-400 text-sm mt-0.5">{avis.length} avis · {avis.filter(a => !a.reponse_gestionnaire).length} sans réponse</p>
        </div>

        {avis.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-gray-400 text-sm">Aucun avis client pour le moment.</p>
            <p className="text-gray-300 text-xs mt-1">Les avis apparaîtront ici une fois que les clients auront séjourné dans votre établissement.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-5xl font-black text-gray-900 mb-1">{noteMoyenne}</p>
                <EtoilesMoyenne note={Number(noteMoyenne)} />
                <p className="text-sm text-gray-400 mt-2">{avis.length} avis vérifiés</p>
              </div>
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Répartition des notes</h3>
                <div className="space-y-2">
                  {repartition.map(r => (
                    <div key={r.note} className="flex items-center gap-3">
                      <button onClick={() => setFiltreNote(filtreNote === r.note ? 0 : r.note)}
                        className="flex items-center gap-1 shrink-0 hover:opacity-70 transition-opacity">
                        <span className="text-sm font-medium text-gray-600 w-3">{r.note}</span>
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                      </button>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="text-sm text-gray-400 w-8 text-right">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex gap-2">
                {[
                  { val: 'tous', label: 'Tous' },
                  { val: 'non_repondus', label: 'À répondre' },
                  { val: 'repondus', label: 'Répondus' },
                ].map(f => (
                  <button key={f.val} onClick={() => setFiltreStat(f.val)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${filtreStat === f.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              {filtreNote > 0 && (
                <button onClick={() => setFiltreNote(0)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium border border-amber-200">
                  {filtreNote} <Star size={11} className="fill-amber-500" /> seulement · ✕
                </button>
              )}
            </div>

            <div className="space-y-4">
              {avisFiltres.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-blue-600">{(a.client_nom || 'A')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{a.client_nom}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(n => (
                                <Star key={n} size={11} className={n <= a.note ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(a.date_avis)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {a.reponse_gestionnaire ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                            <CheckCircle size={11} /> Répondu
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">À répondre</span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">{a.commentaire}</p>

                    {a.reponse_gestionnaire && (
                      <div className="mt-4 ml-4 pl-4 border-l-2 border-blue-200 bg-blue-50 rounded-r-xl p-3">
                        <p className="text-xs font-bold text-blue-700 mb-1">Votre réponse</p>
                        <p className="text-sm text-blue-600">{a.reponse_gestionnaire}</p>
                      </div>
                    )}

                    {!a.reponse_gestionnaire && (
                      <div className="mt-4">
                        {reponseOuverte === a.id ? (
                          <div>
                            <textarea
                              value={texteReponse}
                              onChange={e => setTexteReponse(e.target.value)}
                              rows={3}
                              placeholder="Rédigez votre réponse professionnelle..."
                              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => { setReponseOuverte(null); setTexteReponse('') }}
                                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium rounded-lg text-xs">
                                Annuler
                              </button>
                              <button onClick={() => envoyerReponse(a.id)} disabled={!texteReponse.trim() || enEnvoi}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-semibold rounded-lg text-xs transition-colors">
                                {enEnvoi ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                                Publier la réponse
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setReponseOuverte(a.id)}
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            <MessageSquare size={14} /> Répondre à cet avis
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {avisFiltres.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <p className="text-3xl mb-2">⭐</p>
                  <p className="text-gray-400 text-sm">Aucun avis dans cette catégorie</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

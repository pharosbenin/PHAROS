import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const HotelActifContext = createContext(null)

export function HotelActifProvider({ children }) {
  const [hotels, setHotels] = useState([])
  const [hotelActifId, setHotelActifId] = useState(() => {
    const saved = localStorage.getItem('pharos_hotel_actif')
    return saved ? parseInt(saved) : null
  })
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    api.get('/gestionnaire/hotels/')
      .then(res => {
        const data = res.data || []
        setHotels(data)
        const ids = data.map(h => h.id)
        const savedId = parseInt(localStorage.getItem('pharos_hotel_actif'))
        if (!savedId || !ids.includes(savedId)) {
          const valide = data.find(h => h.statut === 'valide') || data[0]
          if (valide) {
            setHotelActifId(valide.id)
            localStorage.setItem('pharos_hotel_actif', valide.id)
          }
        }
      })
      .catch(() => {})
      .finally(() => setChargement(false))
  }, [])

  const changerHotel = (id) => {
    setHotelActifId(id)
    localStorage.setItem('pharos_hotel_actif', id)
  }

  const hotelActif = hotels.find(h => h.id === hotelActifId) || hotels[0] || null

  return (
    <HotelActifContext.Provider value={{ hotels, hotelActif, changerHotel, chargement }}>
      {children}
    </HotelActifContext.Provider>
  )
}

export const useHotelActif = () => useContext(HotelActifContext)

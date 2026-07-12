import api from './api'

export const getCategoriesAssistance = () =>
  api.get('/assistance/categories/').then(res => res.data)

export const getMonSejour = (numeroReservation, email) =>
  api.get(`/assistance/mon-sejour/${numeroReservation}/`, {
    params: email ? { email } : {},
  }).then(res => res.data)

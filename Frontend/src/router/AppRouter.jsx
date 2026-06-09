import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import HotelierGuard from './HotelierGuard'

// Pages publiques
import Accueil from '../pages/public/Accueil'
import Resultats from '../pages/public/Resultats'
import DetailEtablissement from '../pages/public/DetailEtablissement'
import Reservation from '../pages/public/Reservation'
import Paiement from '../pages/public/Paiement'
import Confirmation from '../pages/public/Confirmation'
import Remboursement from '../pages/public/Remboursement'
import Connexion from '../pages/public/Connexion'
import InscriptionHotelier from '../pages/public/InscriptionHotelier'

// Pages client
import EspaceClient from '../pages/client/EspaceClient'
import CommandeRestaurant from '../pages/client/CommandeRestaurant'

// Pages hôtelier
import DashboardHotelier from '../pages/hotelier/DashboardHotelier'
import GestionEtablissement from '../pages/hotelier/GestionEtablissement'
import GestionChambres from '../pages/hotelier/GestionChambres'
import GestionRestauration from '../pages/hotelier/GestionRestauration'
import GestionReservations from '../pages/hotelier/GestionReservations'
import GestionAvis from '../pages/hotelier/GestionAvis'
import GestionAbonnements from '../pages/hotelier/GestionAbonnements'

// Pages admin
import DashboardAdmin from '../pages/admin/DashboardAdmin'
import ValidationHotels from '../pages/admin/ValidationHotels'
import GestionUtilisateurs from '../pages/admin/GestionUtilisateurs'
import GestionCommissions from '../pages/admin/GestionCommissions'
import GestionEvenements from '../pages/admin/GestionEvenements'
import Moderation from '../pages/admin/Moderation'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Accueil />} />
        <Route path="/recherche" element={<Resultats />} />
        <Route path="/etablissement/:id" element={<DetailEtablissement />} />
        <Route path="/reservation/:id" element={<Reservation />} />
        <Route path="/paiement" element={<Paiement />} />
        <Route path="/confirmation/:reservationId" element={<Confirmation />} />
        <Route path="/remboursement" element={<Remboursement />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/inscription-hotelier" element={<InscriptionHotelier />} />

        {/* Client */}
        <Route path="/client/espace" element={
          <ProtectedRoute role="client"><EspaceClient /></ProtectedRoute>
        } />
        <Route path="/client/reservation/:numero/restaurant" element={
          <ProtectedRoute role="client"><CommandeRestaurant /></ProtectedRoute>
        } />

        {/* Hôtelier */}
        <Route path="/hotelier/dashboard" element={
          <ProtectedRoute role="gestionnaire"><HotelierGuard><DashboardHotelier /></HotelierGuard></ProtectedRoute>
        } />
        <Route path="/hotelier/etablissement" element={
          <ProtectedRoute role="gestionnaire"><HotelierGuard><GestionEtablissement /></HotelierGuard></ProtectedRoute>
        } />
        <Route path="/hotelier/chambres" element={
          <ProtectedRoute role="gestionnaire"><HotelierGuard><GestionChambres /></HotelierGuard></ProtectedRoute>
        } />
        <Route path="/hotelier/restauration" element={
          <ProtectedRoute role="gestionnaire"><HotelierGuard><GestionRestauration /></HotelierGuard></ProtectedRoute>
        } />
        <Route path="/hotelier/reservations" element={
          <ProtectedRoute role="gestionnaire"><HotelierGuard><GestionReservations /></HotelierGuard></ProtectedRoute>
        } />
        <Route path="/hotelier/avis" element={
          <ProtectedRoute role="gestionnaire"><HotelierGuard><GestionAvis /></HotelierGuard></ProtectedRoute>
        } />
        <Route path="/hotelier/abonnements" element={
          <ProtectedRoute role="gestionnaire"><HotelierGuard><GestionAbonnements /></HotelierGuard></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="admin"><DashboardAdmin /></ProtectedRoute>
        } />
        <Route path="/admin/hotels" element={
          <ProtectedRoute role="admin"><ValidationHotels /></ProtectedRoute>
        } />
        <Route path="/admin/utilisateurs" element={
          <ProtectedRoute role="admin"><GestionUtilisateurs /></ProtectedRoute>
        } />
        <Route path="/admin/commissions" element={
          <ProtectedRoute role="admin"><GestionCommissions /></ProtectedRoute>
        } />
        <Route path="/admin/evenements" element={
          <ProtectedRoute role="admin"><GestionEvenements /></ProtectedRoute>
        } />
        <Route path="/admin/moderation" element={
          <ProtectedRoute role="admin"><Moderation /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

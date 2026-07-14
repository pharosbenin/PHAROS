# CAHIER DES CHARGES — PLATEFORME PHAROS BÉNIN

**Version :** 2.2
**Date :** Juillet 2026
**Auteurs :** Chanel AKOUEHOU et Charlotte AHOUAVLAME
**Statut :** Document de référence

---

## TABLE DES MATIÈRES

1. Contexte et présentation
2. Objectifs du projet
3. Périmètre fonctionnel
4. Acteurs du système
5. Exigences fonctionnelles
6. Exigences non fonctionnelles
7. Architecture technique
8. Modèle de données
9. API REST — Endpoints
10. Règles de gestion
11. Contraintes techniques
12. Évolutions futures (V2)
13. Glossaire

---

## 1. CONTEXTE ET PRÉSENTATION

### 1.1 Contexte

Le Bénin dispose d'un secteur hôtelier en plein développement, porté par le tourisme culturel (Fête du Vodun, pèlerinage de Dassa, We Love Yaoundé — Bénin), le tourisme d'affaires à Cotonou et Parakou, et le développement des infrastructures nationales. Cependant, la réservation hôtelière reste majoritairement informelle : appels téléphoniques, visites physiques, absence de visibilité en ligne pour la plupart des établissements.

PHAROS est une plateforme numérique de réservation hôtelière conçue spécifiquement pour le marché béninois. Elle prend en compte les réalités locales : paiement par Mobile Money (MTN MoMo, Moov Money, Celtiis Money) et carte bancaire, couverture géographique nationale sur les 77 communes du Bénin, interface entièrement en français, et vérification par QR Code à l'accueil.

### 1.2 Nom et signification

**PHAROS** — En référence au phare d'Alexandrie, symbole de guidage et d'orientation. PHAROS guide les voyageurs béninois vers les meilleurs hébergements du pays.

### 1.3 Vision

Devenir la référence nationale de la réservation hôtelière au Bénin, en offrant une expérience digitale complète, accessible et adaptée aux usages locaux.

---

## 2. OBJECTIFS DU PROJET

### 2.1 Objectifs métier

| # | Objectif |
|---|----------|
| O1 | Permettre aux voyageurs de rechercher et réserver un hébergement en ligne, 24h/24 |
| O2 | Offrir aux hôteliers un espace de gestion complet de leur établissement |
| O3 | Intégrer le paiement Mobile Money et carte bancaire |
| O4 | Dématérialiser le check-in via QR Code |
| O5 | Générer des revenus via des commissions sur chaque réservation |
| O6 | Mettre en avant les événements nationaux béninois pour booster les réservations |
| O7 | Garantir la confiance via un système d'avis vérifiés et une modération active |

### 2.2 Objectifs techniques

- Plateforme web responsive (desktop + mobile)
- API REST découplée (frontend Vercel / backend Render)
- Authentification JWT sécurisée
- Déploiement cloud sans infrastructure propre

---

## 3. PÉRIMÈTRE FONCTIONNEL

La plateforme couvre 3 espaces distincts selon le rôle de l'utilisateur.

### Espace Public (non connecté)
- Accueil + Recherche avec bandeau événement
- Résultats de recherche (badges En vedette / Partenaire certifié)
- Fiche établissement, Réservation, Paiement (Mobile Money / Carte bancaire)
- Confirmation + QR Code, Suivi de réservation, Reçu public (scan QR)
- Remboursement / Annulation
- Inscription hôtelier, Connexion / Inscription client
- Pages : À propos, Contact, Règles & Conditions

### Espace Client (rôle = client)
- Dashboard mes réservations
- Modifier / Annuler une réservation
- Commander au restaurant de l'hôtel
- Assistance voyageur (« Mon Séjour ») : services de proximité autour de l'hôtel
- Donner un avis après séjour, Profil personnel

### Espace Hôtelier (rôle = gestionnaire)
- Dashboard KPIs (actualisé toutes les 30 secondes)
- Gestion établissement, chambres & promotions
- Gestion réservations + QR check-in
- Gestion restauration (menu + commandes)
- Gestion avis et abonnements (Freemium / Pro)

### Espace Administrateur (rôle = admin)
- Dashboard global, validation des hôtels
- Gestion utilisateurs, modération avis / signalements
- Gestion commissions et demandes upgrade Pro
- Gestion événements nationaux + boost hôtels
- Gestion messages de contact

---

## 4. ACTEURS DU SYSTÈME

### 4.1 Visiteur anonyme
Peut consulter, rechercher, réserver sans compte et payer.

### 4.2 Client (rôle = client)
Voyageur enregistré. Suivi des réservations, modification, annulation, avis, restaurant.

### 4.3 Gestionnaire hôtelier (rôle = gestionnaire)
Propriétaire ou gérant. Espace complet de gestion. Compte créé à l'inscription hôtelier.

### 4.4 Administrateur (rôle = admin)
Équipe PHAROS. Validation hôtels, modération, commissions, événements nationaux.

---

## 5. EXIGENCES FONCTIONNELLES

### 5.1 MODULE AUTHENTIFICATION

**Inscription Client :** prénom, nom, email, mot de passe, téléphone (format béninois : 10 chiffres commençant par 01).

**Connexion :** email + mot de passe. JWT access token 8h + refresh token 7j (rotation automatique). Redirection selon le rôle. Synchronisation multi-onglets.

**OTP :** Code à 6 chiffres par SMS via Africa's Talking API. Validité limitée, usage unique. Mode dev : code retourné dans la réponse API.

**Profil :** Modification prénom, nom, email, téléphone. Changement de mot de passe. Upload photo de profil.

---

### 5.2 MODULE RECHERCHE ET DÉCOUVERTE

**Page d'accueil :**
- Barre de recherche : destination, dates, nombre de personnes
- Carousels avec badge "En vedette" (ambre) sur hôtels Pro boostés et "Partenaire certifié" (orange) sur hôtels Pro non boostés
- Section événements nationaux à venir

**Résultats de recherche :**
- Filtres : ville, dates, personnes, prix, équipements, vue grille/liste
- Tri : hôtels boostés > Pro > meilleure note
- Bandeau orange quand la ville a un événement en cours
- Badge "En vedette" sur les cartes des hôtels boostés

**Fiche établissement :** galerie photos, informations complètes, chambres disponibles, carte OpenStreetMap, avis vérifiés, bouton Réserver.

---

### 5.3 MODULE RÉSERVATION

**Création :** accessible sans compte. prix_total = prix_nuit × nb_nuits. Prix promo appliqué automatiquement si promotion active. UUID unique généré.

**Statuts de réservation :**

| Statut | Description |
|--------|-------------|
| en_attente | En attente de paiement — masqué des listes |
| payee | Paiement reçu, QR Code généré |
| confirmee | Réservation confirmée (statut intermédiaire avant check-in) |
| en_cours | Check-in effectué (scan QR) |
| confirme_client | Client a confirmé la fin de séjour |
| confirme_hotel | Hôtel a confirmé la fin de séjour |
| terminee | Double confirmation — fonds libérés |
| annulee | Réservation annulée |
| remboursee | Remboursement effectué |

**Double confirmation (Escrow) :** Fenêtre 5h avant le départ. Les deux parties confirment indépendamment. Quand les deux ont confirmé : statut terminee, avis_disponible = True, commission versée, notifications envoyées.

---

### 5.4 MODULE PAIEMENT

**Méthodes de paiement :**

| Méthode | Code | Type | Saisie |
|---------|------|------|--------|
| MTN Mobile Money | mtn | Mobile | Numéro béninois (10 chiffres, commence par 01) |
| Moov Money | moov | Mobile | Numéro béninois (10 chiffres, commence par 01) |
| Celtiis Money | celtiis | Mobile | Numéro béninois (10 chiffres, commence par 01) |
| Carte bancaire | carte | Carte | Numéro, expiration (MM/AA), CVV, titulaire |

Formatage automatique carte : XXXX XXXX XXXX XXXX. Titulaire en majuscules.

**Commissions :**

| Abonnement | Taux PHAROS |
|------------|-------------|
| Freemium | 3% du montant total |
| Pro | 5% du montant total |

Paiement actuellement simulé — intégration FedaPay / Kkiapay prévue en V2.

---

### 5.5 MODULE QR CODE ET CHECK-IN

- QR Code généré automatiquement après paiement (UUID unique)
- Accessible publiquement à /recu/:code (reçu complet)
- Check-in : hôtelier scanne, reservation.statut devient en_cours
- Un QR Code ne peut être scanné qu'une seule fois (est_utilise = True)
- Seul le gestionnaire de l'hôtel concerné peut scanner

---

### 5.6 MODULE ANNULATION ET MODIFICATION

**Politique d'annulation :**

| Fenêtre | Traitement |
|---------|------------|
| Dans les 2h après le paiement | Remboursement intégral (0% frais) |
| Après 2h | frais = prix_total × taux_annulation de l'hôtel (défaut 20%) |
| Jour d'arrivée ou après | Annulation impossible |

montant_rembourse = prix_total - frais_annulation. Une seule demande par réservation.

**Modification :**

| Fenêtre | Traitement |
|---------|------------|
| Dans les 2h | Remboursement de la différence sans frais |
| Après 2h | frais = différence × taux_modification de l'hôtel (défaut 10%) |

Hausse : supplément à payer. Baisse : remboursement partiel après frais.

---

### 5.7 MODULE AVIS

- Disponible uniquement quand avis_disponible = True (statut terminee)
- Un seul avis par couple (client, hôtel, réservation)
- Approbation admin requise avant publication
- Note de 1 à 5 étoiles + commentaire texte
- Détection mots interdits : français, anglais, Fon/Goun, Yoruba/Nago, Mina/Ewe, Dendi/Bariba, Peul
- note_moyenne recalculée automatiquement à chaque avis approuvé
- Signalements : SignalementAvis, SignalementContenu, SignalementHotel

---

### 5.8 ESPACE CLIENT

| Action | Condition |
|--------|-----------|
| Modifier la réservation | Avant la date d'arrivée, statut payee |
| Annuler la réservation | Avant la date d'arrivée, statut payee |
| Voir le QR Code | Paiement réussi |
| Commander au restaurant | Réservation en cours |
| Consulter « Mon Séjour » (services à proximité) | Séjour actif : payee, confirmee, en_cours, confirme_client, confirme_hotel ou terminee |
| Donner un avis | Statut terminee, avis_disponible = True |
| Confirmer fin de séjour | 5h avant départ, statut en_cours ou confirme_hotel |

---

### 5.9 ESPACE HÔTELIER

**Dashboard KPIs :** Revenus du mois, réservations actives, taux d'occupation, note moyenne, arrivées du jour, 5 réservations récentes, 3 derniers avis. Badge PRO / FREEMIUM. Actualisation toutes les 30 secondes.

**Gestion établissement :** Toutes les informations. Galerie : Freemium max 5 photos, Pro max 15 photos. Localisation par carte interactive (lat/lng). Configuration taux annulation, taux modification et délai d'annulation gratuit (`delai_gratuit`, défaut 24h).

**Gestion chambres :** Création/modification/suppression types de chambre. Prix nuit, prix weekend, capacité, superficie, équipements, nombre d'unités. Photos par chambre. Promotions (prix promo + période).

**Gestion restaurant :** Menu par catégories : entrées, plats, grillades, poissons, végétarien, desserts, boissons, petit-déjeuner. Suivi commandes : en_attente > en_preparation > prete > livree (annulee possible à tout moment).

**Gestion abonnements :** Plan actuel (Freemium / Pro) et commissions perçues. Demande d'upgrade Pro.

---

### 5.10 ESPACE ADMINISTRATEUR

- Validation hôtels : Valider / Rejeter (avec motif) / Suspendre
- Gestion utilisateurs : suspension / réactivation
- Modération : approbation/suppression avis, traitement signalements
- Commissions : suivi statuts (calculé / versé / litige), gestion demandes upgrade Pro
- Événements : création, villes concernées, boost automatique hôtels Pro
- Messages de contact : lecture, marquage comme lu, filtrage par urgence

---

### 5.11 ÉVÉNEMENTS NATIONAUX ET BOOST

Seuls les hôtels Pro sont boostés. Filtre hotel__type_abonnement='pro' appliqué en base de données.

Tri des résultats : est_booste DESC > type_abonnement DESC > note_moyenne DESC

**Badges :**

| Élément | Condition | Couleur |
|---------|-----------|---------|
| "En vedette" | Hôtel Pro boosté, événement actif | Ambre |
| "Partenaire certifié" | Hôtel Pro non boosté | Orange PHAROS |
| Bandeau événement | Ville avec événement en cours | Orange clair |

**Événements référencés :**
- Fête du Vodun (10 jan, Ouidah / Abomey)
- Festival International de Dassa (juil, Dassa-Zoumè)
- Fête Nationale du Bénin (1er août, Cotonou / Porto-Novo)
- We Love Yaoundé — Bénin (26-31 déc, Cotonou)

---

### 5.12 MODULE ASSISTANCE VOYAGEUR (« MON SÉJOUR »)

**Objectif :** permettre à un client en séjour actif de consulter, sans aucune saisie de sa part, les services utiles autour de son hôtel (pharmacies, hôpitaux/cliniques, stations-service, centres commerciaux/marchés, garages/mécaniciens).

**Alimentation des données :** les services référencés proviennent d'un import automatisé depuis **OpenStreetMap** (géocodage des 77 communes du Bénin via Nominatim, puis extraction des points d'intérêt via Overpass API), rejouable à tout moment sans créer de doublons (identifiant externe unique par service) et sans jamais écraser une fiche corrigée manuellement par un administrateur (source = manuel).

**Calcul de proximité :** au chargement, le serveur calcule la distance réelle (formule de Haversine) entre les coordonnées GPS de l'hôtel de la réservation et chaque service actif en base. Seules les catégories ayant au moins un service dans le rayon sont renvoyées, triées par distance croissante.

| Paramètre | Valeur |
|-----------|--------|
| Rayon de recherche standard | 15 km |
| Rayon de secours (si aucun résultat dans le rayon standard) | 50 km, appliqué uniquement si aucune catégorie n'a de résultat dans le rayon standard |

**Contrôle d'accès :** consultable uniquement par le client propriétaire de la réservation (compte connecté ou email correspondant à la réservation) ou un administrateur, et uniquement si la réservation est dans un statut de séjour actif (payee, confirmee, en_cours, confirme_client, confirme_hotel, terminee) — jamais pour une réservation en attente de paiement, annulée ou remboursée.

**Restitution :** pour chaque service — nom, adresse, horaires (si disponibles), distance en km, lien d'itinéraire Google Maps généré à partir des coordonnées GPS.

---

## 6. EXIGENCES NON FONCTIONNELLES

### 6.1 Performance

| Critère | Exigence |
|---------|----------|
| Temps de réponse API | < 500ms pour les endpoints courants |
| Actualisation dashboard | Polling automatique toutes les 30 secondes |
| Chargement page d'accueil | < 3 secondes |

### 6.2 Disponibilité
- Cible : 99% (contrainte Render free tier)
- Premier appel après inactivité Render : 30 à 60 secondes

### 6.3 Sécurité

| Mesure | Détail |
|--------|--------|
| Authentification | JWT (access 8h + refresh 7j) via SimpleJWT |
| Autorisation | Vérification du rôle sur chaque endpoint |
| Mots de passe | Hashage Django (PBKDF2 SHA-256) |
| Comptes suspendus | Accès bloqué (est_suspendu = true) |
| Contenu interdit | Filtrage automatique côté client |
| Cache API | NoCacheAPIMiddleware : Cache-Control no-store |
| CORS | Origines autorisées (Vercel + localhost dev) |

### 6.4 Ergonomie
- Interface en français exclusivement
- Design responsive mobile-first (TailwindCSS 4)
- Palette : bleu marine (#0D1B40), orange accent (#F57C2B)
- Compatibilité : Chrome, Firefox, Edge, Safari (2 dernières versions), Android/iOS

---

## 7. ARCHITECTURE TECHNIQUE

### 7.1 Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Django 4.x + Django REST Framework |
| Base de données | PostgreSQL |
| Authentification | JWT (SimpleJWT) |
| SMS / OTP | Africa's Talking API |
| Frontend | React 19 + Vite |
| Style | TailwindCSS 4 |
| Routing | React Router DOM v7 |
| Requêtes API | Axios + TanStack React Query v5 |
| Icônes | Lucide React |
| Cartes | Leaflet + React Leaflet |
| QR Code | qrcode.react |
| Formulaires | React Hook Form |
| Notifications UI | React Hot Toast |

### 7.2 Applications Django

| App | Responsabilité |
|-----|----------------|
| accounts | Utilisateurs, JWT, OTP SMS, notifications, contacts |
| hotels | Établissements, chambres, photos, restaurant, promotions |
| reservations | Réservations, paiements, QR codes, annulations, modifications |
| avis | Avis clients, signalements |
| commissions | Abonnements, demandes Pro, commissions |
| evenements | Événements nationaux, mises en avant hôtels |
| assistance | Services de proximité (catégories + import OpenStreetMap), assistance voyageur « Mon Séjour » |

### 7.3 Déploiement

| Service | Plateforme |
|---------|------------|
| Backend Django | Render (Web Service) |
| Frontend React | Vercel (CDN mondial) |
| Base de données | Render (PostgreSQL) |
| Fichiers media | Render (volume) — CDN prévu en V2 |

---

## 8. MODÈLE DE DONNÉES

### 8.1 Entités principales

| Entité | App | Description |
|--------|-----|-------------|
| CustomUser | accounts | Utilisateur (client / gestionnaire / admin) |
| Notification | accounts | Notification système |
| MessageContact | accounts | Message du formulaire de contact |
| OTPVerification | accounts | Code OTP par SMS |
| Hotel | hotels | Établissement hôtelier |
| TypeChambre | hotels | Type de chambre |
| PhotoHotel | hotels | Photo galerie de l'hôtel |
| PhotoChambre | hotels | Photo d'un type de chambre |
| PlatMenu | hotels | Plat du restaurant |
| CommandeRestaurant | hotels | Commande client |
| LigneCommande | hotels | Ligne d'une commande |
| Promotion | hotels | Promotion sur une chambre |
| Reservation | reservations | Réservation d'une chambre |
| Paiement | reservations | Paiement d'une réservation |
| QRCodeReservation | reservations | QR Code de check-in |
| Annulation | reservations | Demande d'annulation |
| Modification | reservations | Demande de modification |
| Avis | avis | Avis d'un client |
| SignalementContenu | avis | Signalement automatique (mots interdits) |
| SignalementHotel | avis | Plainte contre un hôtel |
| SignalementAvis | avis | Signalement d'un avis |
| Abonnement | commissions | Abonnement Freemium/Pro |
| DemandeUpgradePro | commissions | Demande de passage en Pro |
| Commission | commissions | Commission prélevée |
| EvenementNational | evenements | Événement culturel/national |
| MiseEnAvantHotel | evenements | Hôtel boosté pendant un événement |
| CategorieService | assistance | Catégorie de service de proximité (pharmacie, hôpital, station-service...) |
| ServiceProximite | assistance | Service géolocalisé concret (nom, adresse, ville, GPS, horaires, source) |

### 8.2 Relations principales

- CustomUser 1:N Hotel, Reservation, Avis, Notification
- Hotel 1:N TypeChambre, PhotoHotel, PlatMenu, Avis, Abonnement, MiseEnAvantHotel
- TypeChambre 1:N Reservation, PhotoChambre, Promotion
- Reservation 1:1 Paiement, QRCodeReservation, Avis, Annulation
- Paiement 1:1 Commission
- EvenementNational 1:N MiseEnAvantHotel
- CategorieService 1:N ServiceProximite
- Hotel ↔ ServiceProximite : pas de relation en base — rapprochement calculé à la volée par distance GPS (Haversine) au moment de la requête « Mon Séjour »

---

## 9. API REST — ENDPOINTS

### 9.1 Authentification

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | /api/auth/inscription/ | Non | Créer un compte client |
| POST | /api/auth/connexion/ | Non | Connexion (email ou username) |
| POST | /api/auth/otp/envoyer/ | Non | Envoyer code OTP SMS |
| POST | /api/auth/otp/verifier/ | Non | Vérifier le code OTP |
| POST | /api/auth/refresh/ | Non | Rafraîchir le token JWT |
| GET/PUT | /api/auth/profil/ | JWT | Voir/modifier son profil |
| POST | /api/auth/changer-mot-de-passe/ | JWT | Changer le mot de passe |
| POST | /api/auth/supprimer-compte/ | JWT | Supprimer le compte |

### 9.2 Hôtels — Public

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/hotels/villes/ | Villes avec hôtels |
| GET | /api/hotels/ | Recherche avec filtres + boost |
| GET | /api/hotels/<id>/ | Détail d'un hôtel |
| GET | /api/hotels/<id>/chambres/ | Chambres disponibles |
| GET | /api/hotels/<id>/avis/ | Avis approuvés |
| GET | /api/hotels/<id>/menu/ | Menu restaurant public |

### 9.3 Réservations

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | /api/reservations/ | Non | Créer une réservation |
| GET | /api/reservations/<uuid>/ | Partiel | Détail |
| POST | /api/reservations/<uuid>/paiement/ | Non | Initier le paiement |
| GET | /api/reservations/<uuid>/qrcode/ | Non | QR Code |
| GET | /api/recu-qr/<code>/ | Non | Reçu public via scan QR |
| POST | /api/reservations/<uuid>/annuler/ | Partiel | Annulation |
| POST | /api/reservations/<uuid>/modifier/ | Partiel | Modification |
| POST | /api/reservations/<uuid>/confirmer-sejour/ | Partiel | Client confirme |
| POST | /api/reservations/<uuid>/commander/ | Client | Commander au restaurant |
| GET | /api/client/reservations/ | Client | Mes réservations |
| POST | /api/avis/ | Client | Soumettre un avis |
| POST | /api/avis/<id>/signaler/ | JWT | Signaler un avis |
| POST | /api/signalements/ | JWT | Signalement contenu interdit |
| POST | /api/signalements/hotel/ | JWT | Signalement d'un hôtel |

### 9.4 Espace Hôtelier

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | /api/gestionnaire/hotels/ | Lister/créer mes hôtels |
| GET/PUT | /api/gestionnaire/hotels/<id>/ | Modifier mon hôtel |
| GET/POST | /api/gestionnaire/hotels/<id>/chambres/ | Mes chambres |
| GET/PUT/DELETE | /api/gestionnaire/hotels/<id>/chambres/<chambre_id>/ | Détail/modifier/supprimer une chambre |
| POST | /api/gestionnaire/hotels/<id>/photos/ | Ajouter une photo hôtel |
| DELETE | /api/gestionnaire/hotels/<id>/photos/<photo_id>/ | Supprimer une photo hôtel |
| POST | /api/gestionnaire/hotels/<id>/chambres/<chambre_id>/photos/ | Ajouter une photo chambre |
| DELETE | /api/gestionnaire/hotels/<id>/chambres/<chambre_id>/photos/<photo_id>/ | Supprimer une photo chambre |
| GET/POST | /api/gestionnaire/hotels/<id>/menu/ | Gérer le menu |
| GET/PUT/DELETE | /api/gestionnaire/hotels/<id>/menu/<plat_id>/ | Détail/modifier/supprimer un plat |
| GET | /api/gestionnaire/hotels/<id>/commandes/ | Commandes restaurant |
| PATCH | /api/gestionnaire/commandes/<id>/statut/ | Statut commande |
| GET/POST | /api/gestionnaire/hotels/<id>/promotions/ | Promotions |
| DELETE | /api/gestionnaire/hotels/<id>/promotions/<promo_id>/ | Supprimer une promotion |
| GET | /api/gestionnaire/reservations/ | Réservations de l'hôtel |
| POST | /api/gestionnaire/check-in/ | Scanner un QR Code |
| POST | /api/reservations/<uuid>/confirmer-sejour-hotel/ | Hôtel confirme |
| GET | /api/gestionnaire/avis/ | Avis reçus |
| POST | /api/gestionnaire/avis/<id>/repondre/ | Répondre à un avis |
| GET | /api/gestionnaire/abonnement/ | Abonnement actuel |
| POST | /api/gestionnaire/abonnement/upgrade/ | Demande upgrade Pro |
| GET | /api/gestionnaire/commissions/ | Mes commissions |

### 9.5 Espace Admin

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/admin/hotels/ | Liste tous les hôtels |
| POST | /api/admin/hotels/<id>/valider/ | Valider un hôtel |
| POST | /api/admin/hotels/<id>/rejeter/ | Rejeter un hôtel |
| POST | /api/admin/hotels/<id>/suspendre/ | Suspendre un hôtel |
| GET | /api/admin/utilisateurs/ | Tous les utilisateurs |
| POST | /api/admin/utilisateurs/<id>/suspendre/ | Suspendre/activer |
| GET | /api/admin/commissions/ | Toutes les commissions |
| GET | /api/admin/abonnements/ | Tous les abonnements |
| GET | /api/admin/demandes-upgrade/ | Demandes Pro |
| POST | /api/admin/demandes-upgrade/<id>/approuver/ | Approuver |
| POST | /api/admin/demandes-upgrade/<id>/rejeter/ | Rejeter |
| GET | /api/admin/avis/ | Tous les avis |
| POST | /api/admin/avis/<id>/approuver/ | Approuver un avis |
| POST | /api/admin/avis/<id>/supprimer/ | Supprimer un avis |
| GET | /api/admin/signalements/ | Signalements avis |
| PATCH | /api/admin/signalements/<id>/traiter/ | Traiter un signalement avis |
| GET | /api/admin/signalements/contenu/ | Signalements contenu |
| PATCH | /api/admin/signalements/contenu/<id>/traiter/ | Traiter un signalement contenu |
| GET | /api/admin/signalements/hotel/ | Plaintes hôtels |
| PATCH | /api/admin/signalements/hotel/<id>/traiter/ | Traiter une plainte hôtel |
| GET | /api/admin/reservations/ | Toutes les réservations |
| GET | /api/admin/evenements/ | Événements nationaux |
| POST | /api/admin/evenements/ | Créer un événement |
| GET/PUT/DELETE | /api/admin/evenements/<id>/ | Modifier/supprimer |
| POST | /api/admin/evenements/mise-en-avant/ | Boost manuel |
| GET | /api/admin/contacts/ | Messages de contact |
| PATCH | /api/admin/contacts/<id>/lire/ | Marquer message comme lu |

### 9.6 Notifications, Contact, Événements

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | /api/notifications/ | JWT | Mes notifications |
| PATCH | /api/notifications/<id>/lire/ | JWT | Marquer comme lu |
| POST | /api/contacts/ | Non | Envoyer un message |
| GET | /api/evenements/ | Non | Événements actifs |
| GET | /api/evenements/<id>/ | Non | Détail avec hôtels boostés |

### 9.7 Assistance voyageur

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|--------------|
| GET | /api/assistance/categories/ | Non | Catégories de service actives |
| GET | /api/assistance/mon-sejour/<numero_reservation>/ | Partiel | Services à proximité de l'hôtel, réservés au client de la réservation (ou admin) et à un séjour actif |

---

## 10. RÈGLES DE GESTION

| Code | Règle |
|------|-------|
| RG01 | Numéros Mobile Money : format béninois (10 chiffres commençant par 01) |
| RG02 | Le statut en_attente est masqué de toutes les listes utilisateurs |
| RG03 | Avis possible uniquement quand avis_disponible = True (double confirmation complète) |
| RG04 | Freemium : max 5 photos — Pro : max 15 photos |
| RG05 | Un seul avis par couple (client, hôtel, réservation) |
| RG06 | Tout avis doit être approuvé par un admin avant publication |
| RG07 | Freemium : PHAROS prélève 3% — Pro : PHAROS prélève 5% |
| RG08 | Seuls les hôtels Pro peuvent être boostés lors des événements |
| RG09 | Prix promo appliqué automatiquement si promotion active à la date d'arrivée |
| RG10 | Un hôtel ne peut recevoir de réservations que si son statut est valide |
| RG11 | QR Code utilisable une seule fois (est_utilise = True après scan) |
| RG12 | Annulation : remboursement intégral dans les 2h, frais après, impossible le jour d'arrivée |
| RG13 | Détection mots interdits : français, anglais, Fon/Goun, Yoruba/Nago, Mina/Ewe, Dendi/Bariba, Peul |
| RG14 | Filtre boost vérifie hotel__type_abonnement='pro' en base — Freemium jamais boosté |
| RG15 | Fenêtre de confirmation fin de séjour : 5 heures avant la date de départ |
| RG16 | Assistance voyageur consultable uniquement sur un séjour actif, dans un rayon de 15 km autour de l'hôtel (étendu à 50 km si aucun résultat) |

---

## 11. CONTRAINTES TECHNIQUES

| Contrainte | Détail |
|-----------|--------|
| Cartographie | OpenStreetMap (gratuit) via react-leaflet |
| Services de proximité | Import OpenStreetMap (Nominatim pour le géocodage, Overpass API pour les points d'intérêt) — gratuit, rejouable, sans doublons |
| Hébergement | Render free tier (backend + BDD), Vercel free tier (frontend) |
| Paiement | Simulé en V1 — FedaPay / Kkiapay prévu en V2 |
| Stockage fichiers | Render — migration CDN prévue en V2 |
| CORS | Origines autorisées configurées (Vercel + localhost dev) |
| SMS OTP | Africa's Talking — mode dev : code dans la réponse API |
| Veille Render | Premier appel après inactivité : 30 à 60 secondes |

---

## 12. ÉVOLUTIONS FUTURES (V2)

| Fonctionnalité | Priorité |
|---------------|----------|
| Intégration passerelle paiement réelle (FedaPay, Kkiapay) | Haute |
| Application mobile (React Native ou PWA) | Haute |
| Stockage médias sur CDN (Cloudinary / AWS S3) | Haute |
| Notifications email automatiques | Haute |
| Notifications push SMS réelles | Moyenne |
| Système de fidélité client (points, réductions) | Moyenne |
| Multi-langue (anglais, Fon) | Moyenne |
| Tableau de bord analytique avancé | Moyenne |
| Programme de partenariat (agences, tour-opérateurs) | Basse |
| Gestion des transferts aéroport / excursions | Basse |

---

## 13. GLOSSAIRE

| Terme | Définition |
|-------|------------|
| PHAROS | Plateforme de réservation hôtelière béninoise |
| Gestionnaire | Propriétaire ou gérant d'un établissement inscrit sur PHAROS |
| Freemium | Abonnement de base gratuit, commission de 3%, max 5 photos |
| Pro | Abonnement payant, commission de 5%, max 15 photos, boost événements |
| QR Code | Code bidimensionnel utilisé pour le check-in physique |
| Mobile Money | Paiement mobile : MTN MoMo, Moov Money, Celtiis Money |
| Carte bancaire | Paiement par carte crédit/débit |
| Check-in | Arrivée du client, validée par scan du QR Code |
| Double confirmation | Client + hôtel confirment la fin du séjour avant libération des fonds |
| Escrow | Rétention des fonds jusqu'à validation mutuelle du séjour |
| Assistance voyageur (Mon Séjour) | Fonctionnalité affichant les services de proximité (pharmacie, hôpital, station-service...) autour de l'hôtel d'un séjour actif |
| En vedette | Badge sur les hôtels Pro boostés pendant un événement actif |
| Partenaire certifié | Badge sur les hôtels Pro non boostés |
| Taux d'occupation | Chambres occupées aujourd'hui / total chambres |
| JWT | JSON Web Token — authentification sans session côté serveur |
| DRF | Django REST Framework |
| FCFA | Franc CFA — monnaie utilisée au Bénin |

---

Document produit et maintenu à partir du code source du projet PHAROS BÉNIN.
Dernière mise à jour : Juillet 2026 — v2.2 (ajout module Assistance voyageur « Mon Séjour » : app assistance, entités CategorieService/ServiceProximite, endpoints, règle RG16)
Précédente : Juin 2026 — v2.1 (corrections : statut confirmee, delai_gratuit, nom événement, statut annulee restaurant, endpoints complets)

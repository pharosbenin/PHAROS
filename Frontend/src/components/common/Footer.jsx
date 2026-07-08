import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-1">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-0">
          {/* Branding */}
          <div className="md:col-span-1">
            
            <p className="text-sm text-gray-400 leading-relaxed">
              La  plateforme béninoise de réservation d'hébergements hôteliers et parahôteliers.
            </p> 
              <ul className="space-y-2 mt-2">
             <li><Link to="/regles" className="  text-sm text-[#F57C2B] hover:text-orange-400 transition-colors font-medium">Règles de la plateforme</Link></li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="text-white font-semibold mb-1">Navigation</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm hover:text-white transition-colors">Accueil</Link></li>
              <li><Link to="/recherche" className="text-sm hover:text-white transition-colors">Rechercher un hôtel</Link></li>
              <li><Link to="/connexion" className="text-sm hover:text-white transition-colors">Se connecter</Link></li>
              <li><Link to="/suivi-reservation" className="text-sm hover:text-white transition-colors">Gérer ma réservation</Link></li>
              <li><Link to="/inscription-hotelier" className="text-sm hover:text-white transition-colors">Inscrire mon hôtel</Link></li>
              </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><span className="text-sm">Réservation en ligne</span></li>
              <li><span className="text-sm">Paiement Mobile Money</span></li>
              <li><span className="text-sm">QR Code check-in</span></li>
              <li><span className="text-sm">Tableau de bord hôtelier</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-blue-400" />
                Parakou, Bénin
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone size={16} className="shrink-0 text-blue-400" />
                +229 01 64 61 38 61
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail size={16} className="shrink-0 text-blue-400" />
                shanelmahugnon@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 PHAROS BÉNIN. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link to="/regles" className="hover:text-white transition-colors">Conditions d'utilisation</Link>
            <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

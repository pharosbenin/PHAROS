export function criteresMotDePasse(motDePasse) {
  return {
    longueur: motDePasse.length >= 8,
    majuscule: /[A-Z]/.test(motDePasse),
    minuscule: /[a-z]/.test(motDePasse),
    chiffre: /\d/.test(motDePasse),
    special: /[^A-Za-z0-9]/.test(motDePasse),
  }
}

export function motDePasseEstSolide(motDePasse) {
  return Object.values(criteresMotDePasse(motDePasse)).every(Boolean)
}

export const MESSAGE_MOT_DE_PASSE_FAIBLE =
  'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'

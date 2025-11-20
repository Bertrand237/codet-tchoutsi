/**
 * Normalise un numéro de téléphone pour générer un email alias cohérent
 * Retire les espaces, tirets et caractères spéciaux
 * S'assure que le numéro commence par un +
 */
export function normalizePhoneNumber(phone: string): string {
  // Retirer tous les espaces, tirets, parenthèses, etc.
  let normalized = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // S'assurer qu'il commence par +
  if (!normalized.startsWith('+')) {
    // Si commence par 00, remplacer par +
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.substring(2);
    }
    // Si commence par 0 (numéro local camerounais), ajouter +237
    else if (normalized.startsWith('0')) {
      normalized = '+237' + normalized.substring(1);
    }
    // Sinon, ajouter + au début
    else {
      normalized = '+' + normalized;
    }
  }
  
  return normalized;
}

/**
 * Génère un email alias cohérent pour un numéro de téléphone
 */
export function generatePhoneAlias(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return `${normalized}@codet.local`;
}

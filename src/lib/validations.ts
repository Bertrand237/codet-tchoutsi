/**
 * Zod validation schemas for CODET application forms.
 * Provides reusable schemas and helper functions for form validation.
 */
import { z } from 'zod';

// ==================== Schemas ====================

/** Member schema (create/edit) */
export const memberSchema = z.object({
  displayName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide').optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
  gender: z.enum(['monsieur', 'madame']).optional().or(z.literal('')),
  role: z.string().min(1, 'Le rôle est requis'),
  profession: z.string().optional().or(z.literal('')),
  ville: z.string().optional().or(z.literal('')),
  pays: z.string().optional().or(z.literal('')),
  sousComite: z.string().optional().or(z.literal('')),
});

/** Project schema (create/edit) */
export const projectSchema = z.object({
  nom: z.string().min(3, 'Le nom du projet doit contenir au moins 3 caractères'),
  description: z.string().optional().or(z.literal('')),
  statut: z.string().min(1, 'Le statut est requis'),
  priorite: z.string().optional().or(z.literal('')),
  dateDebut: z.string().optional().or(z.literal('')),
  dateFin: z.string().optional().or(z.literal('')),
  budget: z.number().min(0, 'Le budget ne peut pas être négatif').optional(),
});

/** Payment schema (create) */
export const paymentSchema = z.object({
  montant: z.coerce.number().positive('Le montant doit être supérieur à 0'),
  mode: z.string().min(1, 'Le mode de paiement est requis'),
  description: z.string().optional().or(z.literal('')),
  membreNom: z.string().min(1, 'Le nom du membre est requis'),
});

/** Event schema (create/edit) */
export const eventSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional().or(z.literal('')),
  dateDebut: z.string().min(1, 'La date de début est requise'),
  dateFin: z.string().optional().or(z.literal('')),
  lieu: z.string().optional().or(z.literal('')),
  couleur: z.string().optional().or(z.literal('')),
});

/** Blog post schema (create/edit) */
export const blogSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  contenu: z.string().min(20, 'Le contenu doit contenir au moins 20 caractères'),
});

/** Vote/Poll schema (create) */
export const voteSchema = z.object({
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional().or(z.literal('')),
  options: z
    .array(z.string().min(1, 'Chaque option doit avoir un texte'))
    .min(2, 'Au moins 2 options sont requises'),
});

/** Census/Family schema (create/edit) */
export const censusSchema = z.object({
  nomFamille: z.string().min(2, 'Le nom de famille doit contenir au moins 2 caractères'),
  chefFamille: z.string().min(2, 'Le nom du chef de famille est requis'),
  telephone: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  membres: z.string().optional().or(z.literal('')),
});

// ==================== Types ====================

export type MemberFormData = z.infer<typeof memberSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type BlogFormData = z.infer<typeof blogSchema>;
export type VoteFormData = z.infer<typeof voteSchema>;
export type CensusFormData = z.infer<typeof censusSchema>;

// ==================== Helpers ====================

/**
 * Converts a ZodError into a simple Record<string, string> map.
 * Returns the first validation error per field.
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((err) => {
    const field = err.path[0]?.toString();
    if (field && !errors[field]) {
      errors[field] = err.message;
    }
  });
  return errors;
}

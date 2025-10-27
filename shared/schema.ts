import { z } from "zod";

// User roles
export const userRoles = ["admin", "président", "trésorier", "commissaire", "membre", "visiteur"] as const;
export type UserRole = typeof userRoles[number];

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(userRoles),
  profession: z.string().optional(),
  photoURL: z.string().optional(),
  phoneNumber: z.string().optional(),
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// Payment schema
export const paymentStatuses = ["en_attente", "validé", "rejeté"] as const;
export type PaymentStatus = typeof paymentStatuses[number];

export const paymentModes = ["espèces", "mobile_money", "virement", "autre"] as const;
export type PaymentMode = typeof paymentModes[number];

export const paymentSchema = z.object({
  id: z.string(),
  membreId: z.string(),
  membreNom: z.string(),
  montant: z.number().positive(),
  date: z.date(),
  mode: z.enum(paymentModes),
  preuveURL: z.string().optional(),
  statut: z.enum(paymentStatuses),
  commentaire: z.string().optional(),
  validePar: z.string().optional(),
  dateValidation: z.date().optional(),
  createdAt: z.date(),
});

export type Payment = z.infer<typeof paymentSchema>;

export const insertPaymentSchema = paymentSchema.omit({ id: true, createdAt: true, statut: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Family census schema
export const familyMemberSchema = z.object({
  nom: z.string(),
  prenom: z.string(),
  dateNaissance: z.date().optional(),
  relation: z.string(), // père, mère, enfant, conjoint, etc.
});

export const familySchema = z.object({
  id: z.string(),
  membreId: z.string(),
  membreNom: z.string(),
  adresse: z.string(),
  telephone: z.string(),
  membres: z.array(familyMemberSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Family = z.infer<typeof familySchema>;
export type FamilyMember = z.infer<typeof familyMemberSchema>;

export const insertFamilySchema = familySchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFamily = z.infer<typeof insertFamilySchema>;

// Message schema (chat)
export const messageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  text: z.string(),
  timestamp: z.date(),
});

export type Message = z.infer<typeof messageSchema>;

export const insertMessageSchema = messageSchema.omit({ id: true, timestamp: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Blog post schema
export const blogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  imageUrl: z.string().optional(),
  authorId: z.string(),
  authorName: z.string(),
  isPublished: z.boolean(),
  publishedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BlogPost = z.infer<typeof blogPostSchema>;

export const insertBlogPostSchema = blogPostSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// Advertisement schema
export const advertisementSchema = z.object({
  id: z.string(),
  title: z.string(),
  videoUrl: z.string(),
  isActive: z.boolean(),
  order: z.number(),
  createdAt: z.date(),
});

export type Advertisement = z.infer<typeof advertisementSchema>;

export const insertAdvertisementSchema = advertisementSchema.omit({ id: true, createdAt: true });
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;

// Project schema
export const projectStatuses = ["planifié", "en_cours", "en_pause", "terminé", "archivé"] as const;
export type ProjectStatus = typeof projectStatuses[number];

export const projectPriorities = ["basse", "moyenne", "haute", "urgente"] as const;
export type ProjectPriority = typeof projectPriorities[number];

export const projectSchema = z.object({
  id: z.string(),
  titre: z.string(),
  description: z.string(),
  statut: z.enum(projectStatuses),
  priorite: z.enum(projectPriorities),
  budget: z.number().optional(),
  budgetUtilise: z.number().optional(),
  responsableId: z.string(),
  responsableNom: z.string(),
  dateDebut: z.date(),
  dateEcheance: z.date(),
  dateAchevement: z.date().optional(),
  membresAssignes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  progression: z.number().min(0).max(100).optional(), // 0-100%
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof projectSchema>;

export const insertProjectSchema = projectSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Budget transaction schema
export const transactionTypes = ["revenu", "dépense"] as const;
export type TransactionType = typeof transactionTypes[number];

export const transactionCategories = [
  "cotisations",
  "dons",
  "événements",
  "projets",
  "fonctionnement",
  "salaires",
  "fournitures",
  "communication",
  "autre"
] as const;
export type TransactionCategory = typeof transactionCategories[number];

export const budgetTransactionSchema = z.object({
  id: z.string(),
  type: z.enum(transactionTypes),
  montant: z.number().positive(),
  categorie: z.enum(transactionCategories),
  description: z.string(),
  date: z.date(),
  projetId: z.string().optional(),
  projetNom: z.string().optional(),
  creePar: z.string(),
  creeParNom: z.string(),
  createdAt: z.date(),
});

export type BudgetTransaction = z.infer<typeof budgetTransactionSchema>;

export const insertBudgetTransactionSchema = budgetTransactionSchema.omit({ id: true, createdAt: true });
export type InsertBudgetTransaction = z.infer<typeof insertBudgetTransactionSchema>;

// Event schema (calendar)
export const eventTypes = ["réunion", "événement", "formation", "cérémonie", "autre"] as const;
export type EventType = typeof eventTypes[number];

export const eventSchema = z.object({
  id: z.string(),
  titre: z.string(),
  description: z.string(),
  type: z.enum(eventTypes),
  dateDebut: z.date(),
  dateFin: z.date(),
  lieu: z.string().optional(),
  organisateurId: z.string(),
  organisateurNom: z.string(),
  participantsIds: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Event = z.infer<typeof eventSchema>;

export const insertEventSchema = eventSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Poll/Vote schema
export const pollOptionSchema = z.object({
  id: z.string(),
  texte: z.string(),
  votes: z.number(),
});

export const pollSchema = z.object({
  id: z.string(),
  question: z.string(),
  description: z.string().optional(),
  options: z.array(pollOptionSchema),
  creePar: z.string(),
  creeParNom: z.string(),
  dateDebut: z.date(),
  dateFin: z.date(),
  actif: z.boolean(),
  votants: z.array(z.string()).optional(), // User IDs who voted
  createdAt: z.date(),
});

export type Poll = z.infer<typeof pollSchema>;
export type PollOption = z.infer<typeof pollOptionSchema>;

export const insertPollSchema = pollSchema.omit({ id: true, createdAt: true, votants: true });
export type InsertPoll = z.infer<typeof insertPollSchema>;

// Statistics schema for dashboard
export const statisticsSchema = z.object({
  totalMembers: z.number(),
  totalPayments: z.number(),
  pendingPayments: z.number(),
  validatedPayments: z.number(),
  totalAmount: z.number(),
  totalFamilies: z.number(),
  totalMessages: z.number(),
  totalBlogPosts: z.number(),
  totalProjects: z.number().optional(),
  activeProjects: z.number().optional(),
  completedProjects: z.number().optional(),
});

export type Statistics = z.infer<typeof statisticsSchema>;

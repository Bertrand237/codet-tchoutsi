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
  senderId: z.string(),
  senderName: z.string(),
  senderPhotoURL: z.string().optional(),
  content: z.string(),
  timestamp: z.date(),
  readBy: z.array(z.string()).optional(),
});

export type Message = z.infer<typeof messageSchema>;

export const insertMessageSchema = messageSchema.omit({ id: true, timestamp: true, readBy: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Blog post schema
export const blogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  imageURL: z.string().optional(),
  authorId: z.string(),
  authorName: z.string(),
  published: z.boolean(),
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
  videoURL: z.string(),
  active: z.boolean(),
  order: z.number(),
  createdAt: z.date(),
});

export type Advertisement = z.infer<typeof advertisementSchema>;

export const insertAdvertisementSchema = advertisementSchema.omit({ id: true, createdAt: true });
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;

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
});

export type Statistics = z.infer<typeof statisticsSchema>;

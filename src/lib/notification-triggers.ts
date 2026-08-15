/**
 * Notification Auto-Trigger Utility
 * Provides functions to create notifications in the NOTIFICATIONS Appwrite collection
 * when key events happen (payments, events, blog posts, projects, votes, system).
 */

import { addDoc, getDocs } from '@/lib/db';
import { COLLECTIONS } from '@/lib/appwrite';

export type NotificationType = 'payment' | 'event' | 'blog' | 'project' | 'vote' | 'system';

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  userId?: string;
  link?: string;
}

/**
 * Create a single notification document in the NOTIFICATIONS collection.
 */
export async function createNotification(data: NotificationData) {
  await addDoc(COLLECTIONS.NOTIFICATIONS, {
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Notify when a payment is received from a member.
 */
export async function notifyPaymentReceived(memberName: string, amount: string) {
  return createNotification({
    title: 'Paiement reçu',
    message: `${memberName} a effectué un paiement de ${amount}.`,
    type: 'payment',
    link: '/payments',
  });
}

/**
 * Notify when a new event is created.
 */
export async function notifyEventCreated(eventName: string, date: string) {
  return createNotification({
    title: 'Nouvel événement',
    message: `L'événement « ${eventName} » est prévu le ${date}.`,
    type: 'event',
    link: '/calendar',
  });
}

/**
 * Notify when a new blog post is published.
 */
export async function notifyBlogPublished(title: string, authorName: string) {
  return createNotification({
    title: 'Nouvel article',
    message: `${authorName} a publié « ${title} ».`,
    type: 'blog',
    link: '/blog',
  });
}

/**
 * Notify when a project status is updated.
 */
export async function notifyProjectUpdate(projectName: string, status: string) {
  return createNotification({
    title: 'Mise à jour de projet',
    message: `Le projet « ${projectName} » est maintenant : ${status}.`,
    type: 'project',
    link: '/projects',
  });
}

/**
 * Notify when a vote/poll has ended.
 */
export async function notifyVoteEnded(pollTitle: string) {
  return createNotification({
    title: 'Sondage terminé',
    message: `Le sondage « ${pollTitle} » est terminé. Consultez les résultats.`,
    type: 'vote',
    link: '/votes',
  });
}

/**
 * Notify when a new member joins the community.
 */
export async function notifyNewMember(memberName: string) {
  return createNotification({
    title: 'Nouveau membre',
    message: `${memberName} a rejoint la communauté CODET.`,
    type: 'system',
    link: '/members',
  });
}

/**
 * Create a notification for every member in the USERS collection.
 */
export async function notifyAllMembers(data: Omit<NotificationData, 'userId'>) {
  const usersResult = await getDocs(COLLECTIONS.USERS);
  const notifications = usersResult.documents.map((user: any) =>
    createNotification({
      ...data,
      userId: user.$id || user.id,
    })
  );
  await Promise.all(notifications);
}

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const submitVote = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié pour voter"
    );
  }

  const {pollId, optionId} = data;
  const userId = context.auth.uid;

  if (!pollId || !optionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "pollId et optionId sont requis"
    );
  }

  try {
    return await db.runTransaction(async (transaction) => {
      const pollRef = db.collection("polls").doc(pollId);
      const pollDoc = await transaction.get(pollRef);

      if (!pollDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Sondage introuvable"
        );
      }

      const poll = pollDoc.data();

      if (!poll?.actif) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Ce sondage n'est plus actif"
        );
      }

      const votants = poll.votants || [];
      if (votants.includes(userId)) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Vous avez déjà voté pour ce sondage"
        );
      }

      const optionIndex = poll.options.findIndex(
        (opt: any) => opt.id === optionId
      );

      if (optionIndex === -1) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Option de vote invalide"
        );
      }

      const updatedOptions = [...poll.options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        votes: (updatedOptions[optionIndex].votes || 0) + 1,
      };

      transaction.update(pollRef, {
        options: updatedOptions,
        votants: admin.firestore.FieldValue.arrayUnion(userId),
      });

      return {
        success: true,
        message: "Vote enregistré avec succès",
      };
    });
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "Erreur lors de l'enregistrement du vote",
      error.message
    );
  }
});

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const userRef = db.collection("users").doc(user.uid);

  const usersSnapshot = await db.collection("users").limit(1).get();
  const isFirstUser = usersSnapshot.empty;

  const userData = {
    id: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0] || "Utilisateur",
    role: isFirstUser ? "admin" : "membre",
    photoURL: user.photoURL || null,
    phoneNumber: user.phoneNumber || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userRef.set(userData);

  console.log(`Utilisateur créé: ${user.uid} avec rôle: ${userData.role}`);

  return null;
});

export const onEventCreated = functions.firestore
  .document("events/{eventId}")
  .onCreate(async (snapshot, context) => {
    const event = snapshot.data();

    console.log(`Nouvel événement créé: ${event.titre}`);

    return null;
  });

export const onPaymentValidated = functions.firestore
  .document("payments/{paymentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.statut !== "validé" && after.statut === "validé") {
      console.log(`Paiement validé: ${after.membreNom} - ${after.montant} FCFA`);
    }

    return null;
  });

export const cleanupExpiredPolls = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    const expiredPolls = await db
      .collection("polls")
      .where("actif", "==", true)
      .where("dateFin", "<", now)
      .get();

    const batch = db.batch();
    let count = 0;

    expiredPolls.forEach((doc) => {
      batch.update(doc.ref, {actif: false});
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`${count} sondages expirés désactivés`);
    }

    return null;
  });

export const getStatistics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié"
    );
  }

  try {
    const [users, projects, payments, events, polls, messages] =
      await Promise.all([
        db.collection("users").count().get(),
        db.collection("projects").count().get(),
        db.collection("payments").count().get(),
        db.collection("events").count().get(),
        db.collection("polls").count().get(),
        db.collection("messages").count().get(),
      ]);

    return {
      totalUsers: users.data().count,
      totalProjects: projects.data().count,
      totalPayments: payments.data().count,
      totalEvents: events.data().count,
      totalPolls: polls.data().count,
      totalMessages: messages.data().count,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      "internal",
      "Erreur lors de la récupération des statistiques",
      error.message
    );
  }
});

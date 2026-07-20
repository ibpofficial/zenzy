import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface NotificationItem {
  id?: string;
  userId: string;
  title: string;
  text: string;
  read: boolean;
  type: string;
  createdAt: string;
}

/**
 * Triggers a real-time notification for a user.
 * @param userId - The target user's UID (recipient).
 * @param title - Notification title.
 * @param text - Notification detailed text.
 * @param type - Notification type (e.g., 'booking', 'message', 'system').
 */
export async function triggerNotification(
  userId: string,
  title: string,
  text: string,
  type: string = "system"
) {
  if (!userId) return;
  try {
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      userId,
      title,
      text,
      read: false,
      type,
      createdAt: new Date().toISOString(),
    });

    // Send OS level background web push notification
    fetch("/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title,
        body: text,
        url: type === "message" || type === "support" ? "/dashboard" : "/dashboard"
      }),
    }).catch((err) => {
      console.warn("Background web push send failed (user might not be subscribed):", err);
    });
  } catch (error) {
    console.error("Error triggering notification: ", error);
  }
}

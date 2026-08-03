import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface NotificationItem {
  id?: string;
  userId: string;
  projectId?: string;
  title: string;
  text: string;
  read: boolean;
  type: string;
  linkUrl?: string;
  createdAt: string;
}

/**
 * Triggers a real-time notification for a user.
 * @param userId - The target user's UID (recipient).
 * @param title - Notification title.
 * @param text - Notification detailed text.
 * @param type - Notification type (e.g., 'booking', 'message', 'system', 'project_dates', 'decision', etc.).
 * @param projectId - Optional project ID for project-level notification filtering.
 * @param linkUrl - Optional deep link URL.
 */
export async function triggerNotification(
  userId: string,
  title: string,
  text: string,
  type: string = "system",
  projectId?: string,
  linkUrl?: string
) {
  if (!userId) return;
  try {
    const notificationsRef = collection(db, "notifications");
    const docData: any = {
      userId,
      title,
      text,
      read: false,
      type,
      createdAt: new Date().toISOString(),
    };

    if (projectId) docData.projectId = projectId;
    if (linkUrl) docData.linkUrl = linkUrl;

    await addDoc(notificationsRef, docData);

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
        url: linkUrl || (projectId ? `/workspace/${projectId}` : "/dashboard")
      }),
    }).catch((err) => {
      console.warn("Background web push send failed (user might not be subscribed):", err);
    });
  } catch (error) {
    console.error("Error triggering notification: ", error);
  }
}

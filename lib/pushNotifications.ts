/**
 * pushNotifications.ts
 * Handles Web Push subscription via Firebase Cloud Messaging (FCM).
 *
 * ─────────────────────────────────────────────────────────────────────
 *  SETUP REQUIRED (one-time):
 *  1. Go to Firebase Console → Project Settings → Cloud Messaging
 *  2. Under "Web Push certificates" click "Generate key pair"
 *  3. Copy the VAPID Public Key and paste it below as VAPID_PUBLIC_KEY
 * ─────────────────────────────────────────────────────────────────────
 */

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// ── Default generated VAPID key pair for Zenzy Web Push ──────────────────────
const VAPID_PUBLIC_KEY = "BH5mf1WfgSODIomR3T9jtgRbrPFIOcS8sQ5LK_0N-ozC6qaJB06IQEpuknv8aNaI7SdV3PCljzn9aDIfUBdqbvg";
// ─────────────────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Registers the service worker, creates a push subscription,
 * and saves the subscription endpoint to Firestore under the user doc.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported in this browser.");
      return false;
    }

    // Register / get existing SW registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
      });
    }

    // Persist subscription to Firestore
    const subJson = subscription.toJSON();
    await setDoc(
      doc(db, "pushSubscriptions", userId),
      {
        userId,
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("✅ Push subscription saved for user:", userId);
    return true;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
}

/**
 * Unsubscribes from push and removes the Firestore record.
 */
export async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
    // Remove Firestore record
    await setDoc(doc(db, "pushSubscriptions", userId), { unsubscribed: true, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Unsubscribe failed:", err);
  }
}

/**
 * Checks if push notifications are currently enabled for this user.
 */
export function isPushEnabled(): boolean {
  if (typeof Notification === "undefined") return false;
  return Notification.permission === "granted";
}

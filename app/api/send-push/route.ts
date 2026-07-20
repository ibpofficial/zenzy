import { NextResponse } from "next/server";
import webpush from "web-push";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Initialize Firebase client on the server side to fetch subscriptions
const firebaseConfig = {
  apiKey: "AIzaSyBD8I4rMj-AJoqZoVarb205hCB26Oe4fao",
  authDomain: "zenzy-d2e0e.firebaseapp.com",
  projectId: "zenzy-d2e0e",
  storageBucket: "zenzy-d2e0e.firebasestorage.app",
  messagingSenderId: "937394853130",
  appId: "1:937394853130:web:a59cb1db2d87ce610fd6f3"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// VAPID keys matching public key in pushNotifications.ts
const publicKey = "BH5mf1WfgSODIomR3T9jtgRbrPFIOcS8sQ5LK_0N-ozC6qaJB06IQEpuknv8aNaI7SdV3PCljzn9aDIfUBdqbvg";
const privateKey = "YgmkdX9DMaJgsWiu02F3C_c8GiayQqyLSvL3bQ7d80E";

webpush.setVapidDetails(
  "mailto:support@zenzy.in",
  publicKey,
  privateKey
);

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: "Missing required fields (userId, title, body)" },
        { status: 400 }
      );
    }

    // Fetch subscription from Firestore
    const subDocRef = doc(db, "pushSubscriptions", userId);
    const subDoc = await getDoc(subDocRef);

    if (!subDoc.exists()) {
      return NextResponse.json(
        { error: "No push subscription found for user" },
        { status: 404 }
      );
    }

    const subData = subDoc.data();
    if (subData.unsubscribed) {
      return NextResponse.json(
        { error: "User has unsubscribed from push notifications" },
        { status: 400 }
      );
    }

    const pushSubscription = {
      endpoint: subData.endpoint,
      keys: subData.keys
    };

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/"
    });

    await webpush.sendNotification(pushSubscription, payload);

    return NextResponse.json({ success: true, message: "Push notification sent successfully" });
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: "Failed to send push notification", details: error.message },
      { status: 500 }
    );
  }
}

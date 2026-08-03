import { doc, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const STORAGE_KEY = "zenzy_profile_visits";

export function getLocalProfileVisits(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Error reading profile visits from localStorage:", e);
    return {};
  }
}

export function recordProfileVisit(proId: string, userId?: string) {
  if (typeof window === "undefined" || !proId) return;

  try {
    const visits = getLocalProfileVisits();
    const newCount = (visits[proId] || 0) + 1;
    visits[proId] = newCount;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));

    // Dispatch event so active pages update immediately
    window.dispatchEvent(new CustomEvent("zenzy-visits-changed", { detail: { proId, count: newCount } }));

    // Async lightweight sync to Firestore user document if user is logged in
    if (userId) {
      setDoc(
        doc(db, "users", userId),
        { profileVisits: { [proId]: increment(1) } },
        { merge: true }
      ).catch((err) => {
        console.warn("Background visit count sync error:", err);
      });
    }
  } catch (e) {
    console.error("Error recording profile visit:", e);
  }
}

export function syncProfileVisitsWithUserData(userDataVisits?: Record<string, number>) {
  if (typeof window === "undefined" || !userDataVisits) return;
  try {
    const local = getLocalProfileVisits();
    let updated = false;
    Object.entries(userDataVisits).forEach(([proId, count]) => {
      if (typeof count === "number" && count > (local[proId] || 0)) {
        local[proId] = count;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      window.dispatchEvent(new CustomEvent("zenzy-visits-changed"));
    }
  } catch (e) {
    console.error("Error syncing profile visits:", e);
  }
}

import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
import { calculateTrustScore } from "@/lib/trustScore";
import { BusinessProfile, Project } from "@/lib/schema";

// Initialize Firebase client on the server side
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

// Helper function to recalculate trust score for all workers
async function recalculateAllWorkers(force: boolean) {
  const configRef = doc(db, "settings", "trustScoreConfig");
  const configSnap = await getDoc(configRef);
  const now = Date.now();

  if (!force && configSnap.exists()) {
    const configData = configSnap.data();
    if (configData.lastRecalculatedAt) {
      const lastTime = new Date(configData.lastRecalculatedAt).getTime();
      const elapsed = now - lastTime;
      if (elapsed < 24 * 60 * 60 * 1000) {
        return {
          success: true,
          skipped: true,
          message: "Recalculation skipped. Already updated in the last 24 hours.",
          lastRecalculatedAt: configData.lastRecalculatedAt,
        };
      }
    }
  }

  // Fetch all workers from the "workers" collection
  const workersRef = collection(db, "workers");
  const workersSnap = await getDocs(workersRef);

  const results = [];
  for (const wDoc of workersSnap.docs) {
    const wId = wDoc.id;
    const wData = { uid: wDoc.id, ...wDoc.data() } as unknown as BusinessProfile;

    // Fetch reviews from the "reviews" collection filtered by workerId
    const reviewsRef = collection(db, "reviews");
    const reviewsQuery = query(reviewsRef, where("workerId", "==", wId));
    const reviewsSnap = await getDocs(reviewsQuery);
    const reviewsList: { rating: number }[] = [];
    reviewsSnap.forEach((doc) => {
      const data = doc.data();
      if (typeof data.rating === "number") {
        reviewsList.push({ rating: data.rating });
      }
    });

    // Fetch projects from the "projects" collection filtered by businessId
    const projectsRef = collection(db, "projects");
    const projectsQuery = query(projectsRef, where("businessId", "==", wId));
    const projectsSnap = await getDocs(projectsQuery);
    const projectsList: { status: Project["status"] }[] = [];
    projectsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status) {
        projectsList.push({ status: data.status as Project["status"] });
      }
    });

    // Determine response time
    const avgResponseTimeHours = (wData as any).avgResponseTimeHours !== undefined
      ? Number((wData as any).avgResponseTimeHours)
      : undefined;

    // Calculate trust score
    const computedTrustScore = calculateTrustScore({
      profile: wData,
      reviews: reviewsList,
      projects: projectsList,
      avgResponseTimeHours,
    });

    // Update worker profile
    await updateDoc(wDoc.ref, {
      trustScore: computedTrustScore,
    });

    results.push({ workerId: wId, trustScore: computedTrustScore });
  }

  // Write the cached structure back to the settings document
  await setDoc(configRef, {
    lastRecalculatedAt: new Date(now).toISOString(),
  }, { merge: true });

  return {
    success: true,
    skipped: false,
    message: "Recalculated trust scores for all professionals.",
    count: results.length,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { workerId, force } = body;

    if (workerId) {
      // 1. Fetch the worker profile from the "workers" collection
      const workerDocRef = doc(db, "workers", workerId);
      const workerSnap = await getDoc(workerDocRef);

      if (!workerSnap.exists()) {
        return NextResponse.json(
          { error: `Worker profile not found for ID: ${workerId}` },
          { status: 404 }
        );
      }

      const workerData = { uid: workerSnap.id, ...workerSnap.data() } as unknown as BusinessProfile;

      // 2. Fetch reviews from the "reviews" collection filtered by workerId
      const reviewsRef = collection(db, "reviews");
      const reviewsQuery = query(reviewsRef, where("workerId", "==", workerId));
      const reviewsSnap = await getDocs(reviewsQuery);
      const reviewsList: { rating: number }[] = [];
      reviewsSnap.forEach((doc) => {
        const data = doc.data();
        if (typeof data.rating === "number") {
          reviewsList.push({ rating: data.rating });
        }
      });

      // 3. Fetch projects from the "projects" collection filtered by businessId
      const projectsRef = collection(db, "projects");
      const projectsQuery = query(projectsRef, where("businessId", "==", workerId));
      const projectsSnap = await getDocs(projectsQuery);
      const projectsList: { status: Project["status"] }[] = [];
      projectsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.status) {
          projectsList.push({ status: data.status as Project["status"] });
        }
      });

      // 4. Determine response time (from profile, or default fallback)
      const avgResponseTimeHours = (workerData as any).avgResponseTimeHours !== undefined
        ? Number((workerData as any).avgResponseTimeHours)
        : undefined;

      // 5. Calculate trust score
      const computedTrustScore = calculateTrustScore({
        profile: workerData,
        reviews: reviewsList,
        projects: projectsList,
        avgResponseTimeHours,
      });

      // 6. Write the cached structure back to the worker document
      await updateDoc(workerDocRef, {
        trustScore: computedTrustScore,
      });

      return NextResponse.json({
        success: true,
        workerId,
        trustScore: computedTrustScore,
      });
    } else {
      // Recalculate all workers
      const result = await recalculateAllWorkers(!!force);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error("Error recalculating trust score:", error);
    return NextResponse.json(
      { error: "Failed to recalculate trust score", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const result = await recalculateAllWorkers(force);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error recalculating trust score via GET:", error);
    return NextResponse.json(
      { error: "Failed to recalculate trust score", details: error.message },
      { status: 500 }
    );
  }
}


/**
 * Shared image compression + Firebase Storage upload utilities.
 * Compresses images client-side before upload to reduce storage costs and improve speed.
 */
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Compress an image File to a Blob (JPEG) under a target size.
 */
export async function compressImageToBlob(
  file: File,
  maxWidth = 900,
  quality = 0.78,
  targetKB = 200
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const tryCompress = (q: number): string => {
          const canvas = document.createElement("canvas");
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas context error")); return ""; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg", q);
        };

        let result = tryCompress(quality);
        let q = quality;
        // Iteratively reduce quality if still too large
        while (result.length > targetKB * 1024 * 1.37 && q > 0.3) {
          q -= 0.08;
          result = tryCompress(q);
        }

        // Convert base64 to Blob
        const byteString = atob(result.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: "image/jpeg" }));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an image File to a base64 JPEG string (legacy/fallback use).
 */
export async function compressImageToBase64(
  file: File,
  maxWidth = 900,
  quality = 0.72,
  targetKB = 180
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const tryCompress = (q: number): string => {
          const canvas = document.createElement("canvas");
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas error")); return ""; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg", q);
        };

        let result = tryCompress(quality);
        let q = quality;
        while (result.length > targetKB * 1024 * 1.37 && q > 0.3) {
          q -= 0.1;
          result = tryCompress(q);
        }
        resolve(result);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compress and upload a profile image to Firebase Storage.
 * Returns the public download URL.
 * Path: avatars/{userId}/{timestamp}.jpg
 */
export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<string> {
  const blob = await compressImageToBlob(file, 600, 0.82, 150);
  const timestamp = Date.now();
  const storageRef = ref(storage, `avatars/${userId}/${timestamp}.jpg`);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Compress multiple files in parallel, returning base64 strings.
 */
export async function compressMultipleImages(
  files: File[],
  maxWidth = 900,
  quality = 0.72
): Promise<string[]> {
  return Promise.all(files.map(f => compressImageToBase64(f, maxWidth, quality)));
}

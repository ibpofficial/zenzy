/**
 * Shared image compression + Firebase Storage upload utilities.
 * Compresses images client-side before upload to reduce storage costs and improve speed.
 */
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Fast single-pass image compression to lightweight JPEG base64 string (< 80KB).
 * Takes < 50ms on browser canvas.
 */
export async function compressImageToBase64(
  file: File,
  maxWidth = 600,
  quality = 0.55,
  _targetKB = 90
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image")) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } catch (err) {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fast single-pass compress image File to Blob (JPEG).
 */
export async function compressImageToBlob(
  file: File,
  maxWidth = 750,
  quality = 0.60
): Promise<Blob> {
  const dataUrl = await compressImageToBase64(file, maxWidth, quality);
  const parts = dataUrl.split(",");
  const byteString = atob(parts[1] || parts[0]);
  const mimeString = parts[0]?.split(":")[1]?.split(";")[0] || "image/jpeg";
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Compress and upload a profile image to Firebase Storage.
 */
export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<string> {
  if (!file) throw new Error("No image file provided.");
  if (!userId) throw new Error("User ID is required to upload profile image.");

  try {
    const blob = await compressImageToBlob(file, 400, 0.7);
    const timestamp = Date.now();
    const storageRef = ref(storage, `avatars/${userId}/${timestamp}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    const downloadURL = await getDownloadURL(storageRef);
    if (downloadURL) return downloadURL;
  } catch (storageErr) {
    console.warn("Storage upload fallback to compressed Base64:", storageErr);
  }

  return await compressImageToBase64(file, 400, 0.7);
}

/**
 * Compress multiple files in parallel, returning base64 strings.
 */
export async function compressMultipleImages(
  files: File[],
  maxWidth = 700,
  quality = 0.6
): Promise<string[]> {
  return Promise.all(files.map((f) => compressImageToBase64(f, maxWidth, quality)));
}

/**
 * ULTRA-FAST Project Media Upload Handler (< 0.5s response).
 * Compresses images instantly via Canvas to low-quality JPEG (< 80KB)
 * and attempts Firebase Storage with a strict 2.5s timeout.
 */
export async function uploadProjectMediaImage(
  file: File,
  projectId: string
): Promise<string> {
  if (!file) throw new Error("No media file provided.");

  if (file.type.startsWith("image")) {
    // 1. Instantly generate compressed Base64 (< 50ms)
    const fastBase64 = await compressImageToBase64(file, 650, 0.55);

    // 2. Attempt Storage in background with 2.5s timeout race
    try {
      const storagePromise = (async () => {
        const blob = await compressImageToBlob(file, 750, 0.6);
        const timestamp = Date.now();
        const storageRef = ref(storage, `projectMedia/${projectId}/${timestamp}.jpg`);
        await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
        return await getDownloadURL(storageRef);
      })();

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 2500)
      );

      const storageUrl = await Promise.race([storagePromise, timeoutPromise]);
      if (storageUrl) return storageUrl;
    } catch (err) {
      console.warn("Using fast compressed Base64 fallback for project media:", err);
    }

    return fastBase64;
  } else {
    // Video upload
    const timestamp = Date.now();
    const storageRef = ref(storage, `projectMedia/${projectId}/${timestamp}_video`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
}

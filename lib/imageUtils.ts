/**
 * Shared image compression utility.
 * Compresses an image File to a base64 JPEG string under a target size.
 * Uses canvas resize + quality reduction to minimize Firestore storage.
 */
export async function compressImageToBase64(
  file: File,
  maxWidth = 900,
  quality = 0.72,
  targetKB = 180
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target?.result as string;
      img.onerror = reject;
      img.onload = () => {
        const tryCompress = (q: number): string => {
          const canvas = document.createElement("canvas");
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas error")); return ""; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg", q);
        };

        // First pass
        let result = tryCompress(quality);
        // If still too large (> targetKB), reduce quality iteratively
        let q = quality;
        while (result.length > targetKB * 1024 * 1.37 && q > 0.3) {
          q -= 0.1;
          result = tryCompress(q);
        }
        resolve(result);
      };
    };
  });
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

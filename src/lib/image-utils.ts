
/**
 * Compresses an image file or data URL to a target size and dimensions.
 * Useful for ensuring Firestore documents stay under the 1MB limit.
 */
export async function compressImage(
  dataUrl: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed data URL
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => reject(err);
  });
}

/**
 * Checks if a string (like a base64 data URL) is within a certain byte size limit.
 */
export function isWithinSizeLimit(str: string, maxBytes: number = 1048576): boolean {
  // Base64 string size calculation: (n * (3/4)) - padding
  // But we can just check the string length for a rough estimate
  // A 1MB limit is 1,048,576 bytes.
  return str.length <= maxBytes * 1.33;
}

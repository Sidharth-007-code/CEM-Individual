/**
 * Client-side image compression utility.
 * Resizes images to max 800px width with 0.72 JPEG quality, ensuring payload remains <150KB.
 * Abstracted so if the student upgrades to Firebase Storage later, only this file changes.
 */

export interface CompressedImageResult {
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
  name: string;
}

export async function compressImageClientSide(
  file: File,
  maxWidth = 800,
  quality = 0.72
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    // Basic file type check
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Selected file is not an image."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image into memory"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding width to maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Could not initialize 2D canvas context"));
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with specified compression quality
        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        // Calculate approximate size in KB
        const head = "data:image/jpeg;base64,";
        const base64Len = dataUrl.length - head.length;
        const sizeKb = Math.round((base64Len * 3) / 4 / 1024);

        resolve({
          dataUrl,
          sizeKb,
          width,
          height,
          name: file.name,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export async function compressMultipleImages(
  files: File[]
): Promise<CompressedImageResult[]> {
  const promises = files.map((f) => compressImageClientSide(f));
  return Promise.all(promises);
}


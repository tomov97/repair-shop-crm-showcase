import imageCompression from "browser-image-compression";

export const PHOTO_COMPRESSION = {
  maxWidthOrHeight: 1280,
  initialQuality: 0.6,
  fileType: "image/webp" as const,
  maxSizeMB: 0.5,
  useWebWorker: true,
};

export async function compressPhoto(file: File): Promise<File> {
  return imageCompression(file, PHOTO_COMPRESSION);
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

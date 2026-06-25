"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { compressPhoto, getImageDimensions } from "@/lib/image-compression";
import type { PhotoView, PhotoType, IntakePhotos } from "@/lib/intake-photos";

type UploadingPhoto = {
  id: string;
  previewUrl: string;
  progress: "compressing" | "uploading" | "done" | "error";
  errorMessage?: string;
};

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function Lightbox({ photo, onClose }: { photo: { url: string; label: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!photo) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [photo, onClose]);

  if (!photo) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, next/image doesn't support arbitrary external URLs */}
      <img
        src={photo.url}
        alt={photo.label}
        className="max-h-[92vh] max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="fixed bottom-4 left-0 right-0 text-center text-sm text-white/70">{photo.label} — натисни навсякъде за затваряне</p>
    </div>,
    document.body,
  );
}

function PhotoGrid({
  intakeId,
  photoType,
  label,
  photos,
  onUploaded,
  onDeleted,
}: {
  intakeId: string;
  photoType: PhotoType;
  label: string;
  photos: PhotoView[];
  onUploaded: (photo: PhotoView) => void;
  onDeleted: (photoId: string) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingPhoto[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, position: number) => {
    const tempId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    setUploading((prev) => [...prev, { id: tempId, previewUrl, progress: "compressing" }]);

    let compressed: File;
    try {
      compressed = await compressPhoto(file);
    } catch {
      setUploading((prev) =>
        prev.map((u) => u.id === tempId ? { ...u, progress: "error", errorMessage: "Грешка при компресия." } : u)
      );
      return;
    }

    const dims = await getImageDimensions(compressed);

    setUploading((prev) =>
      prev.map((u) => u.id === tempId ? { ...u, progress: "uploading" } : u)
    );

    const fd = new FormData();
    fd.append("file", compressed, compressed.name || `photo.webp`);
    fd.append("photo_type", photoType);
    fd.append("position", String(position));
    if (dims) {
      fd.append("width", String(dims.width));
      fd.append("height", String(dims.height));
    }

    try {
      const res = await fetch(`/api/intakes/${intakeId}/photos`, { method: "POST", body: fd });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Грешка при качване.");
      }
      const photo = await res.json() as PhotoView;
      setUploading((prev) => prev.filter((u) => u.id !== tempId));
      URL.revokeObjectURL(previewUrl);
      onUploaded(photo);
    } catch (err) {
      setUploading((prev) =>
        prev.map((u) => u.id === tempId
          ? { ...u, progress: "error", errorMessage: err instanceof Error ? err.message : "Грешка." }
          : u)
      );
    }
  }, [intakeId, photoType, onUploaded]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const startPosition = photos.length + uploading.filter((u) => u.progress !== "error").length;
    Array.from(files).forEach((file, i) => uploadFile(file, startPosition + i));
  }, [photos.length, uploading, uploadFile]);

  const handleDelete = useCallback(async (photoId: string) => {
    if (!confirm("Изтрий тази снимка?")) return;
    setDeletingId(photoId);
    try {
      const res = await fetch(`/api/intakes/${intakeId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) onDeleted(photoId);
    } finally {
      setDeletingId(null);
    }
  }, [intakeId, onDeleted]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <div className="flex gap-2">
          <button
            type="button"
            title="Снимай с камера"
            onClick={() => cameraRef.current?.click()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#23443f]/10 text-[#23443f] transition hover:bg-[#23443f]/20 active:scale-95"
          >
            <CameraIcon />
          </button>
          <button
            type="button"
            title="Избери от галерията"
            onClick={() => galleryRef.current?.click()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#23443f]/10 text-[#23443f] transition hover:bg-[#23443f]/20 active:scale-95"
          >
            <GalleryIcon />
          </button>
        </div>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />

      {photos.length === 0 && uploading.length === 0 ? (
        <p className="text-sm text-muted">Няма снимки.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-[#f0f0f0]">
              {/* eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL */}
              <img
                src={photo.url}
                alt={label}
                className="h-full w-full cursor-zoom-in object-cover"
                onClick={() => setLightboxPhoto({ url: photo.url, label })}
              />
              <button
                type="button"
                disabled={deletingId === photo.id}
                onClick={() => handleDelete(photo.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition hover:bg-red-600/80 group-hover:opacity-100 active:scale-95 disabled:opacity-50"
                title="Изтрий"
              >
                {deletingId === photo.id ? <Spinner /> : <TrashIcon />}
              </button>
            </div>
          ))}

          {uploading.map((u) => (
            <div key={u.id} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-[#f0f0f0]">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview URL */}
              <img src={u.previewUrl} alt="" className="h-full w-full object-cover opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                {u.progress === "error" ? (
                  <p className="px-2 text-center text-[11px] font-medium text-red-700">{u.errorMessage}</p>
                ) : (
                  <>
                    <Spinner />
                    <p className="text-[11px] text-foreground/70">
                      {u.progress === "compressing" ? "Компресиране…" : "Качване…"}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
    </div>
  );
}

export function IntakePhotosSection({
  intakeId,
  initialPhotos,
}: {
  intakeId: string;
  initialPhotos: IntakePhotos;
}) {
  const [before, setBefore] = useState<PhotoView[]>(initialPhotos.before);
  const [after, setAfter] = useState<PhotoView[]>(initialPhotos.after);

  const handleUploaded = useCallback((type: PhotoType) => (photo: PhotoView) => {
    if (type === "before") setBefore((prev) => [...prev, photo]);
    else setAfter((prev) => [...prev, photo]);
  }, []);

  const handleDeleted = useCallback((type: PhotoType) => (photoId: string) => {
    if (type === "before") setBefore((prev) => prev.filter((p) => p.id !== photoId));
    else setAfter((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  return (
    <div className="space-y-5">
      <PhotoGrid
        intakeId={intakeId}
        photoType="before"
        label="Преди"
        photos={before}
        onUploaded={handleUploaded("before")}
        onDeleted={handleDeleted("before")}
      />
      <div className="border-t border-border" />
      <PhotoGrid
        intakeId={intakeId}
        photoType="after"
        label="След"
        photos={after}
        onUploaded={handleUploaded("after")}
        onDeleted={handleDeleted("after")}
      />
    </div>
  );
}

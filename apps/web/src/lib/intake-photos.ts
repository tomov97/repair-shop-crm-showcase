import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { deleteObject, getPresignedGetUrl, putObject } from "@/lib/storage/r2";

export type PhotoType = "before" | "after";

export type PhotoView = {
  id: string;
  photoType: PhotoType;
  url: string;
  width: number | null;
  height: number | null;
  byteSize: number;
  storageKey: string;
};

export type IntakePhotos = {
  before: PhotoView[];
  after: PhotoView[];
};

type PhotoRow = {
  id: string;
  intake_id: string;
  photo_type: string;
  storage_key: string;
  content_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  position: number;
  created_at: string;
};

export async function getIntakePhotos(intakeId: string): Promise<IntakePhotos> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("intake_photos")
    .select("id, intake_id, photo_type, storage_key, content_type, byte_size, width, height, position, created_at")
    .eq("intake_id", intakeId)
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return { before: [], after: [] };
  }

  const rows = data as PhotoRow[];

  const withUrls = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      photoType: row.photo_type as PhotoType,
      url: await getPresignedGetUrl(row.storage_key),
      width: row.width,
      height: row.height,
      byteSize: row.byte_size,
      storageKey: row.storage_key,
    })),
  );

  return {
    before: withUrls.filter((p) => p.photoType === "before"),
    after: withUrls.filter((p) => p.photoType === "after"),
  };
}

export async function createIntakePhoto(params: {
  actorId: string;
  intakeId: string;
  photoType: PhotoType;
  body: Buffer;
  contentType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  position: number;
}): Promise<{ type: "success"; photo: PhotoView } | { type: "error"; message: string }> {
  const { actorId, intakeId, photoType, body, contentType, byteSize, width, height, position } = params;

  const ext = contentType === "image/webp" ? "webp" : contentType === "image/png" ? "png" : "jpg";
  const storageKey = `intakes/${intakeId}/${photoType}/${crypto.randomUUID()}.${ext}`;

  try {
    await putObject(storageKey, body, contentType);
  } catch {
    return { type: "error", message: "Could not upload the photo." };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("intake_photos")
    .insert({
      intake_id: intakeId,
      photo_type: photoType,
      storage_key: storageKey,
      content_type: contentType,
      byte_size: byteSize,
      width,
      height,
      position,
      uploaded_by: actorId,
    })
    .select("id, photo_type, storage_key, byte_size, width, height")
    .single();

  if (error || !data) {
    await deleteObject(storageKey).catch(() => null);
    return { type: "error", message: "Could not save the photo." };
  }

  await supabase.from("audit_events").insert({
    entity_type: "intake_photo",
    entity_id: (data as { id: string }).id,
    event_type: "intake_photo_uploaded",
    actor_id: actorId,
    payload: { intake_id: intakeId, photo_type: photoType, byte_size: byteSize },
  });

  const url = await getPresignedGetUrl(storageKey);

  return {
    type: "success",
    photo: {
      id: (data as { id: string }).id,
      photoType,
      url,
      width,
      height,
      byteSize,
      storageKey,
    },
  };
}

export async function deleteIntakePhoto(params: {
  actorId: string;
  photoId: string;
}): Promise<{ type: "success" } | { type: "error"; message: string }> {
  const { actorId, photoId } = params;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("intake_photos")
    .select("id, storage_key, intake_id, photo_type")
    .eq("id", photoId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return { type: "error", message: "Photo not found." };
  }

  const row = data as { id: string; storage_key: string; intake_id: string; photo_type: string };

  const { error: updateError } = await supabase
    .from("intake_photos")
    .update({ deleted_at: new Date().toISOString(), deleted_by: actorId })
    .eq("id", photoId);

  if (updateError) {
    return { type: "error", message: "Could not delete the photo." };
  }

  await deleteObject(row.storage_key).catch(() => null);

  await supabase.from("audit_events").insert({
    entity_type: "intake_photo",
    entity_id: photoId,
    event_type: "intake_photo_deleted",
    actor_id: actorId,
    payload: { intake_id: row.intake_id, photo_type: row.photo_type },
  });

  return { type: "success" };
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createIntakePhoto, deleteIntakePhoto } from "@/lib/intake-photos";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB hard cap (compressed WebP should be well under this)
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: intakeId } = await params;

  const supabase = getSupabaseAdminClient();
  const { data: intake } = await supabase
    .from("intakes")
    .select("id")
    .eq("id", intakeId)
    .maybeSingle();

  if (!intake) {
    return NextResponse.json({ error: "Intake not found." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const photoType = formData.get("photo_type");
  if (photoType !== "before" && photoType !== "after") {
    return NextResponse.json({ error: "Invalid photo type." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Format not supported." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "The photo is too large." }, { status: 400 });
  }

  const positionRaw = formData.get("position");
  const position = positionRaw ? parseInt(String(positionRaw), 10) : 0;

  const widthRaw = formData.get("width");
  const heightRaw = formData.get("height");
  const width = widthRaw ? parseInt(String(widthRaw), 10) : null;
  const height = heightRaw ? parseInt(String(heightRaw), 10) : null;

  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  const result = await createIntakePhoto({
    actorId: user.id,
    intakeId,
    photoType,
    body,
    contentType: file.type,
    byteSize: file.size,
    width: width && !isNaN(width) ? width : null,
    height: height && !isNaN(height) ? height : null,
    position: isNaN(position) ? 0 : position,
  });

  if (result.type === "error") {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json(result.photo, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params; // intakeId not needed for delete — photo ownership checked in data layer

  let body: { photoId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  if (!body.photoId) {
    return NextResponse.json({ error: "Missing photo ID." }, { status: 400 });
  }

  const result = await deleteIntakePhoto({ actorId: user.id, photoId: body.photoId });

  if (result.type === "error") {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getIntakeIdByScanToken } from "@/lib/intakes";

const KAFEMASHINI_URL = "https://kafemashini.ch";

export default async function ScanTokenPage({
  params,
}: {
  params: Promise<{ scanToken: string }>;
}) {
  const { scanToken } = await params;
  const user = await getCurrentUser();

  const allowedEmails = (process.env.ALLOWED_SCAN_USERS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user || !allowedEmails.includes(user.email?.toLowerCase() ?? "")) {
    redirect(KAFEMASHINI_URL);
  }

  const intakeId = await getIntakeIdByScanToken(scanToken);

  if (!intakeId) {
    notFound();
  }

  redirect(`/intakes/${intakeId}`);
}

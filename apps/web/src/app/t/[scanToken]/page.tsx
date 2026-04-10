import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getIntakeIdByScanToken } from "@/lib/intakes";

export default async function ScanTokenPage({
  params,
}: {
  params: Promise<{ scanToken: string }>;
}) {
  const { scanToken } = await params;
  const [user, intakeId] = await Promise.all([
    getCurrentUser(),
    getIntakeIdByScanToken(scanToken),
  ]);

  if (!intakeId || !user) {
    redirect("https://kafemashini.ch");
  }

  redirect(`/intakes/${intakeId}`);
}

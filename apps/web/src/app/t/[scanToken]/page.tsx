import { redirect } from "next/navigation";
import { getIntakeIdByScanToken } from "@/lib/intakes";

export default async function ScanTokenPage({
  params,
}: {
  params: Promise<{ scanToken: string }>;
}) {
  const { scanToken } = await params;
  const intakeId = await getIntakeIdByScanToken(scanToken);

  if (!intakeId) {
    redirect("https://kafemashini.ch");
  }

  redirect(`/intakes/${intakeId}`);
}

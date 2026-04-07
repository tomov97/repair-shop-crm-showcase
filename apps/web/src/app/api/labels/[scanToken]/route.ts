import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { getIntakeForLabel } from "@/lib/intakes";
import { getAbsoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getLogoDataUrl() {
  const candidates = [
    path.resolve(/* turbopackIgnore: true */ process.cwd(), "logo.png"),
    path.resolve(/* turbopackIgnore: true */ process.cwd(), "..", "..", "logo.png"),
    path.resolve(/* turbopackIgnore: true */ process.cwd(), "..", "logo.png"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const file = readFileSync(candidate);
      return `data:image/png;base64,${file.toString("base64")}`;
    }
  }

  return null;
}

async function buildQrDataUrl(scanUrl: string): Promise<string> {
  return QRCode.toDataURL(scanUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

async function renderLabelSvg(
  intakeNumber: string,
  scanToken: string,
  logoDataUrl: string | null,
): Promise<string> {
  const safeIntakeNumber = intakeNumber.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const scanUrl = getAbsoluteUrl(`/t/${scanToken}`);
  const qrDataUrl = await buildQrDataUrl(scanUrl);

  // Canvas: 732x319 (62mm x 27mm at 300dpi).
  // Matches the aspect ratio the Brother QL-800 driver actually produces
  // on 30mm cut length. Empirically tested — produces the clean layout
  // that looks correct on tape (logo+number left, QR square on right).
  const logoMarkup = logoDataUrl
    ? `<image href="${logoDataUrl}" x="30" y="15" width="290" height="175" preserveAspectRatio="xMidYMid meet" />`
    : `<rect x="30" y="15" width="290" height="175" rx="20" fill="#23443f" />
       <text x="175" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="700" fill="#ffffff">KM</text>`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="732" height="319" viewBox="0 0 732 319" role="img" aria-label="Label">
      <rect width="732" height="319" fill="#ffffff" />

      <!-- Logo top-left -->
      ${logoMarkup}

      <!-- Intake number below logo -->
      <text x="175" y="265" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#000000">${safeIntakeNumber}</text>

      <!-- QR code right -->
      <image href="${qrDataUrl}" x="410" y="15" width="290" height="290" />
    </svg>
  `.trim();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ scanToken: string }> },
) {
  const { scanToken } = await context.params;
  const intake = await getIntakeForLabel(scanToken);

  if (!intake) {
    return new Response("Not found", { status: 404 });
  }

  const svg = await renderLabelSvg(intake.intake_number, scanToken, getLogoDataUrl());

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

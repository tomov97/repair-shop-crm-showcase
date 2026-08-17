import { createHash, randomBytes } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { extractPhoneDigits } from "@/lib/phone";

export function normalizePersonName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
}

export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = extractPhoneDigits(trimmed);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("359")) {
    return `+${digits}`;
  }

  if (digits.startsWith("00")) {
    return `+${digits.slice(2)}`;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    return `+359${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `+359${digits}`;
  }

  if (hasLeadingPlus) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function buildScanToken(submissionToken: string) {
  return createHash("sha256").update(submissionToken).digest("base64url").slice(0, 10);
}

export function generateIntakeNumber(now = new Date()) {
  const year = now.getFullYear().toString().slice(-2);
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const suffix = randomBytes(2).toString("hex").toUpperCase();

  return `KM-${day}/${month}/${year}-${suffix}`;
}

const SOFIA_TZ = "Europe/Sofia";

export function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: SOFIA_TZ,
  }).format(new Date(value)).replace(/\//g, ".");
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "No date";
  }

  const d = new Date(value);
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: SOFIA_TZ,
  }).format(d).replace(/\//g, ".");
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SOFIA_TZ,
  }).format(d);
  return `${date} ${time}`;
}

export function formatMoney(value: number | string | null) {
  if (value === null || value === "") {
    return "Not set";
  }

  const amount = typeof value === "number" ? value : Number(value);

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function safeRedirectUrl(url: string | undefined, fallback: string): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) {
    return fallback;
  }
  return url;
}

export function getAbsoluteUrl(pathname: string) {
  const env = getServerEnv();
  const baseUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${baseUrl}${path}`;
}

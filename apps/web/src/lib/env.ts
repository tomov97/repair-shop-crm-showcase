import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

function parseEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {};
  }

  const contents = readFileSync(filePath, "utf8");

  return contents.split(/\r?\n/).reduce<Record<string, string>>((accumulator, line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return accumulator;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      return accumulator;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function loadFallbackEnv() {
  const candidates = [
    path.resolve(process.cwd(), "apps", "print-agent", ".env"),
    path.resolve(process.cwd(), "..", "print-agent", ".env"),
  ];

  for (const candidate of candidates) {
    const parsed = parseEnvFile(candidate);

    if (Object.keys(parsed).length > 0) {
      return parsed;
    }
  }

  return {};
}

export function getServerEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const fallbackEnv = loadFallbackEnv();

  cachedEnv = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? fallbackEnv.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL
      ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined)
      ?? (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined)
      ?? "http://localhost:3000",
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? fallbackEnv.SUPABASE_SERVICE_ROLE_KEY,
  });

  return cachedEnv;
}

import { config as loadDotenv } from "dotenv";
loadDotenv();

import { spawn } from "node:child_process";
import { resolve as resolvePath } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const envSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  LABEL_PRINTER_NAME: z.string().min(1),
  LABEL_TEMPLATE_PATH: z.string().min(1).default("./assets/label.lbx"),
  WEB_BASE_URL: z.url(),
  PRINT_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
});

type PrintAgentEnv = z.infer<typeof envSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, any, any>;

function loadEnv(): PrintAgentEnv {
  return envSchema.parse(process.env);
}

// ---------------------------------------------------------------------------
// Supabase row types
// ---------------------------------------------------------------------------

type PrintJobRow = {
  id: string;
  intake_id: string;
  status: "queued" | "printing" | "printed" | "failed";
  attempt_count: number;
};

type IntakeDetails = {
  intake_number: string;
  scan_token: string;
};

// ---------------------------------------------------------------------------
// Claim one queued job atomically (queued → printing)
// Returns null if nothing to do.
// ---------------------------------------------------------------------------

async function claimNextJob(supabase: Supabase): Promise<PrintJobRow | null> {
  const { data, error } = await supabase
    .from("print_jobs")
    .select("id, intake_id, status, attempt_count")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const job = data as PrintJobRow;

  const { error: claimError, data: claimed } = await supabase
    .from("print_jobs")
    .update({ status: "printing", attempt_count: job.attempt_count + 1 })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("id");

  if (claimError || !claimed || (claimed as { id: string }[]).length === 0) {
    return null;
  }

  return { ...job, status: "printing", attempt_count: job.attempt_count + 1 };
}

// ---------------------------------------------------------------------------
// Fetch intake details needed to render the template
// ---------------------------------------------------------------------------

async function fetchIntakeDetails(supabase: Supabase, intakeId: string): Promise<IntakeDetails> {
  const { data, error } = await supabase
    .from("intakes")
    .select("intake_number, scan_token")
    .eq("id", intakeId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to load intake ${intakeId}: ${error?.message ?? "not found"}`);
  }

  return data as IntakeDetails;
}

// ---------------------------------------------------------------------------
// Print via Brother b-PAC SDK (PowerShell COM bridge)
// ---------------------------------------------------------------------------

async function printViaBpac(
  templatePath: string,
  intakeNumber: string,
  qrPayload: string,
  printerName: string,
): Promise<void> {
  const scriptPath = resolvePath(process.cwd(), "scripts", "print-label.ps1");

  // Fully detached spawn: no inherited stdio, no shared process group, no
  // parent-process handle coupling. This matches the behavior of running
  // `powershell -File ...` from a standalone shell, which reliably prints
  // correctly, unlike the previous execFile path which degraded subsequent
  // prints when invoked from the long-lived agent process.
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "powershell",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy", "Bypass",
        "-File", scriptPath,
        "-TemplatePath", templatePath,
        "-IntakeNumber", intakeNumber,
        "-QrPayload", qrPayload,
        "-PrinterName", printerName,
      ],
      {
        stdio: "ignore",
        detached: false,
        windowsHide: true,
      },
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`powershell exited with code ${code}`));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Mark job outcome in Supabase
// ---------------------------------------------------------------------------

async function markPrinted(supabase: Supabase, jobId: string): Promise<void> {
  await supabase
    .from("print_jobs")
    .update({ status: "printed", printed_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function markFailed(supabase: Supabase, jobId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await supabase
    .from("print_jobs")
    .update({ status: "failed", last_error: message.slice(0, 1000) })
    .eq("id", jobId);
}

// ---------------------------------------------------------------------------
// Process one job end-to-end
// ---------------------------------------------------------------------------

async function processJob(
  job: PrintJobRow,
  env: PrintAgentEnv,
  templatePath: string,
  supabase: Supabase,
): Promise<void> {
  try {
    console.log(`[print-agent] processing job ${job.id}`);

    const intake = await fetchIntakeDetails(supabase, job.intake_id);
    const qrPayload = `${env.WEB_BASE_URL.replace(/\/$/, "")}/t/${intake.scan_token}`;

    await printViaBpac(templatePath, intake.intake_number, qrPayload, env.LABEL_PRINTER_NAME);
    await markPrinted(supabase, job.id);

    console.log(`[print-agent] job ${job.id} printed OK`);
  } catch (err) {
    console.error(`[print-agent] job ${job.id} failed:`, err);
    await markFailed(supabase, job.id, err);
  }
}

// ---------------------------------------------------------------------------
// Main poll loop
// ---------------------------------------------------------------------------

async function main() {
  const env = loadEnv();
  const templatePath = resolvePath(process.cwd(), env.LABEL_TEMPLATE_PATH);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log("[print-agent] starting");
  console.log(`[print-agent] printer: ${env.LABEL_PRINTER_NAME}`);
  console.log(`[print-agent] template: ${templatePath}`);
  console.log(`[print-agent] poll interval: ${env.PRINT_POLL_INTERVAL_MS}ms`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const job = await claimNextJob(supabase);

      if (job) {
        await processJob(job, env, templatePath, supabase);
        // Give the printer a beat to finish cutting/feeding before submitting
        // the next job — back-to-back jobs stacking at the driver cause the
        // QL-800 to mis-align subsequent prints.
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
    } catch (err) {
      console.error("[print-agent] poll error:", err);
    }

    await new Promise((resolve) => setTimeout(resolve, env.PRINT_POLL_INTERVAL_MS));
  }
}

main().catch((error) => {
  console.error("[print-agent] failed to start:", error);
  process.exit(1);
});

/**
 * Seeds a DEMO Supabase project with realistic showcase data.
 *
 * Never run this against production. The script refuses to start unless the
 * target URL is explicitly listed in DEMO_SUPABASE_URL, and it wipes the
 * business tables before inserting.
 *
 * Usage:
 *   node scripts/seed-demo.mjs
 *
 * Required env (from apps/web/.env.demo):
 *   DEMO_SUPABASE_URL
 *   DEMO_SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // env file is optional when vars are already exported
  }
}

loadEnvFile(resolve(repoRoot, "apps/web/.env.demo"));

const SUPABASE_URL = process.env.DEMO_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.DEMO_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing DEMO_SUPABASE_URL or DEMO_SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Put them in apps/web/.env.demo (see the demo setup notes).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Demo dataset
// ---------------------------------------------------------------------------

const CUSTOMERS = [
  ["Daniel Whitfield", "+44 7700 900142"],
  ["Elena Marchetti", "+39 340 1122334"],
  ["Marcus Lindqvist", "+46 70 123 4567"],
  ["Priya Raghunathan", "+44 7700 900318"],
  ["Tomas Bergmann", "+49 151 22334455"],
  ["Sofia Almeida", "+351 912 445 678"],
  ["Jonas Weber", "+49 160 5544332"],
  ["Claire Dubois", "+33 6 12 34 56 78"],
  ["Andrei Popescu", "+40 721 334 556"],
  ["Hannah Vos", "+31 6 2233 4455"],
  ["Luca Ferrari", "+39 333 8877665"],
  ["Rebecca Nilsen", "+47 912 34 567"],
  ["Ondrej Havel", "+420 601 223 344"],
  ["Maya Kowalski", "+48 512 334 556"],
  ["Nikolas Andreou", "+30 694 112 2334"],
  ["Julia Brandt", "+49 170 9988776"],
  ["Ruben Ortega", "+34 611 223 344"],
  ["Katrin Mayer", "+43 664 1122334"],
  ["Peter Ivanov", "+359 88 512 4477"],
  ["Amelie Roux", "+33 7 55 66 77 88"],
  ["Northgate Bistro Ltd", "+44 20 7946 0812"],
  ["Corner Roasters Cafe", "+44 161 496 0345"],
  ["Blue Door Espresso Bar", "+353 1 437 0122"],
  ["Station Coffee House", "+44 7700 900577"],
];

const MACHINES = [
  ["De'Longhi", "Magnifica S ECAM 22.110"],
  ["De'Longhi", "Dinamica Plus ECAM 370.95"],
  ["De'Longhi", "Eletta Explore ECAM 450"],
  ["Jura", "E8 Piano Black"],
  ["Jura", "ENA 8 Touch"],
  ["Jura", "Z10 Aluminium White"],
  ["Saeco", "Xelsis SM7683"],
  ["Saeco", "Incanto HD8918"],
  ["Philips", "LatteGo 5400 EP5447"],
  ["Philips", "Series 2200 EP2231"],
  ["Gaggia", "Classic Evo Pro"],
  ["Gaggia", "Cadorna Prestige"],
  ["Sage", "Barista Express SES875"],
  ["Sage", "Oracle Touch SES990"],
  ["Melitta", "Barista TS Smart"],
  ["Nivona", "CafeRomatica 759"],
  ["Siemens", "EQ.6 Plus S700"],
  ["Bosch", "VeroCafe Serie 4"],
  ["Krups", "Evidence EA893"],
  ["Rancilio", "Silvia Pro X"],
  ["Lelit", "Bianca V3"],
  ["ECM", "Synchronika"],
];

const SERVICE_ISSUES = [
  "Grinder jams intermittently. Customer reports loud rattle before shutdown.",
  "No water flow from group head. Suspected blocked solenoid valve.",
  "Milk frother produces no foam. Steam wand pressure feels weak.",
  "Machine leaks water from underneath after every brew cycle.",
  "Descaling cycle fails halfway and returns error E4.",
  "Brew unit stuck, cannot be removed. Customer forced the hatch.",
  "Coffee comes out lukewarm. Thermoblock likely failing.",
  "Display frozen on startup logo. No response to buttons.",
  "Loud pump noise, very slow extraction. Possible pump wear.",
  "Ground coffee ends up in the drip tray instead of the cup.",
  "Water tank sensor not detected even when tank is full.",
  "Grinder set too fine at delivery, burrs need inspection and reset.",
  "Machine trips the mains breaker roughly one time in five.",
  "Steam wand drips constantly after use. Valve seal replacement.",
  "Full annual service requested: gaskets, seals, descale, calibration.",
  "Bean hopper cracked, grinder pulls air. Housing replacement needed.",
  "Cup sensor misreads, machine overfills and spills on the tray.",
  "Customer used the wrong descaler. Requires full circuit flush.",
];

const SERVICE_NOTES = [
  "Customer brought the machine without the drip tray.",
  "Under warranty, receipt photographed at intake.",
  "Second visit for the same fault, see previous record.",
  "Customer requested a call before any work over 150.",
  "Commercial site, machine needed back within 3 days.",
  null,
  null,
  null,
];

const SALE_ITEMS = [
  ["De'Longhi", "Magnifica Evo ECAM 290.31"],
  ["Jura", "ENA 4 Full Nordic White"],
  ["Philips", "Series 3300 EP3343"],
  ["Sage", "Bambino Plus SES500"],
  ["Gaggia", "Classic Evo Pro"],
  ["Melitta", "Solo Pure Black"],
  ["Saeco", "PicoBaristo Deluxe"],
  ["Nivona", "CafeRomatica 660"],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pick = (list, index) => list[index % list.length];
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function normalizePhone(display) {
  return display.replace(/\D/g, "");
}

function formatIntakeNumber(prefix, date, sequence) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${prefix}-${dd}/${mm}/${yy}-${String(sequence).padStart(6, "0")}`;
}

function daysAgo(days, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Intake ages, newest first. Weighted so the last 7 days and the last 8 weeks
 * both look busy, which makes the dashboard trend chart read well in a
 * screenshot instead of showing a flat line.
 */
function buildIntakeAges() {
  const ages = [];
  // last 7 days: 1-3 per day
  for (let day = 0; day < 7; day += 1) {
    for (let n = 0; n < randomInt(1, 3); n += 1) ages.push(day);
  }
  // weeks 2-8: 2-4 per week
  for (let week = 1; week < 8; week += 1) {
    for (let n = 0; n < randomInt(2, 4); n += 1) {
      ages.push(week * 7 + randomInt(0, 6));
    }
  }
  // months 3-6: 4-7 per month, gives the monthly view real shape
  for (let month = 2; month < 6; month += 1) {
    for (let n = 0; n < randomInt(4, 7); n += 1) {
      ages.push(month * 30 + randomInt(0, 29));
    }
  }
  return ages.sort((a, b) => a - b);
}

async function wipe() {
  console.log("Wiping demo tables...");
  const tables = ["intake_photos", "print_jobs", "audit_events", "intakes", "customers"];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", randomUUID());
    if (error) throw new Error(`Failed to wipe ${table}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  await wipe();

  // Customers -------------------------------------------------------------
  const customerRows = CUSTOMERS.map(([fullName, displayPhone], index) => ({
    id: randomUUID(),
    full_name: fullName,
    normalized_phone: normalizePhone(displayPhone),
    display_phone: displayPhone,
    created_at: daysAgo(180 - index * 5).toISOString(),
  }));

  const { error: customerError } = await supabase.from("customers").insert(customerRows);
  if (customerError) throw new Error(`customers: ${customerError.message}`);
  console.log(`Inserted ${customerRows.length} customers.`);

  // Service intakes -------------------------------------------------------
  const ages = buildIntakeAges();
  const intakeRows = [];
  const printJobRows = [];
  const auditRows = [];

  // Repeat customers make the "visit count" badge meaningful in screenshots.
  const customerPickOrder = [];
  customerRows.forEach((customer, index) => {
    const visits = index < 5 ? 3 : index < 12 ? 2 : 1;
    for (let n = 0; n < visits; n += 1) customerPickOrder.push(customer);
  });

  ages.forEach((age, index) => {
    const createdAt = daysAgo(age, randomInt(9, 17), randomInt(0, 59));
    const customer = pick(customerPickOrder, index * 7 + 3);
    const [brand, model] = pick(MACHINES, index * 3 + 1);
    const id = randomUUID();

    // Older records are archived and carry a charged amount; recent ones are
    // still on the bench.
    const isArchived = age > 21;
    const archivedAt = isArchived
      ? new Date(createdAt.getTime() + randomInt(2, 9) * 86_400_000).toISOString()
      : null;

    intakeRows.push({
      id,
      customer_id: customer.id,
      intake_number: formatIntakeNumber("SC", createdAt, 7420 - index),
      intake_type: "service",
      scan_token: randomUUID().replace(/-/g, "").slice(0, 24),
      brand,
      model,
      issue_description: pick(SERVICE_ISSUES, index * 5 + 2),
      notes: pick(SERVICE_NOTES, index * 3),
      coffee_count: Math.random() > 0.35 ? randomInt(1200, 18400) : null,
      is_archived: isArchived,
      charged_amount: isArchived ? randomInt(35, 320) : null,
      archived_at: archivedAt,
      created_at: createdAt.toISOString(),
      updated_at: (archivedAt ?? createdAt.toISOString()),
    });

    // Print job per intake. Newest few show the queue in mixed states so the
    // print-queue screenshot demonstrates the failure handling.
    let status = "printed";
    let lastError = null;
    if (index === ages.length - 1) {
      status = "queued";
    } else if (index === ages.length - 2) {
      status = "failed";
      lastError = "Printer offline: QL-800 not responding on USB001";
    } else if (index === ages.length - 3) {
      status = "printing";
    }

    printJobRows.push({
      id: randomUUID(),
      intake_id: id,
      label_asset_url: `http://localhost:3000/api/labels/${intakeRows[intakeRows.length - 1].scan_token}`,
      status,
      attempt_count: status === "queued" ? 0 : 1,
      last_error: lastError,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      printed_at:
        status === "printed" ? new Date(createdAt.getTime() + 24_000).toISOString() : null,
    });

    auditRows.push({
      entity_type: "intake",
      entity_id: id,
      event_type: "intake_created",
      payload: { intake_number: intakeRows[intakeRows.length - 1].intake_number },
      created_at: createdAt.toISOString(),
    });

    if (isArchived) {
      auditRows.push({
        entity_type: "intake",
        entity_id: id,
        event_type: "intake_archived",
        payload: { charged_amount: intakeRows[intakeRows.length - 1].charged_amount },
        created_at: archivedAt,
      });
    }
  });

  // Sales intakes ---------------------------------------------------------
  SALE_ITEMS.forEach(([brand, model], index) => {
    const createdAt = daysAgo(index * 9 + 2, randomInt(10, 18), randomInt(0, 59));
    const customer = pick(customerRows, index * 5 + 2);
    const id = randomUUID();

    intakeRows.push({
      id,
      customer_id: customer.id,
      intake_number: formatIntakeNumber("PK", createdAt, 7548 + index),
      intake_type: "sale",
      scan_token: randomUUID().replace(/-/g, "").slice(0, 24),
      brand,
      model,
      issue_description: null,
      notes: index % 3 === 0 ? "Delivered with a 12 month shop warranty." : null,
      coffee_count: null,
      is_archived: false,
      charged_amount: randomInt(240, 1450),
      archived_at: null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
    });

    printJobRows.push({
      id: randomUUID(),
      intake_id: id,
      label_asset_url: `http://localhost:3000/api/labels/${intakeRows[intakeRows.length - 1].scan_token}`,
      status: "printed",
      attempt_count: 1,
      last_error: null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      printed_at: new Date(createdAt.getTime() + 22_000).toISOString(),
    });
  });

  // Insert in dependency order, chunked to stay under PostgREST payload limits.
  for (const [table, rows] of [
    ["intakes", intakeRows],
    ["print_jobs", printJobRows],
    ["audit_events", auditRows],
  ]) {
    for (let offset = 0; offset < rows.length; offset += 100) {
      const chunk = rows.slice(offset, offset + 100);
      const { error } = await supabase.from(table).insert(chunk);
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    console.log(`Inserted ${rows.length} rows into ${table}.`);
  }

  const activeCount = intakeRows.filter((row) => !row.is_archived && row.intake_type === "service").length;
  console.log("");
  console.log("Demo data ready:");
  console.log(`  ${customerRows.length} customers`);
  console.log(`  ${intakeRows.length} intakes (${activeCount} active service, ${SALE_ITEMS.length} sales)`);
  console.log(`  ${printJobRows.length} print jobs (1 queued, 1 printing, 1 failed)`);
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

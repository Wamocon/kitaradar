/**
 * Setup kitaradar-test and kitaradar-prod schemas
 *
 * Applies all migrations in order and inserts demo seed data.
 * Run with:  node scripts/setup-schemas.mjs
 *
 * Requires SUPABASE_DB_URL in .env.local
 */

import pg from "pg";
const { Client } = pg;
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manual .env.local parser — no dotenv dependency required
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "../.env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env.local not found — rely on existing env vars */ }
}
loadEnvLocal();

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error("❌  SUPABASE_DB_URL nicht in .env.local gesetzt.");
  process.exit(1);
}

const MIGRATION_DIR = join(__dirname, "../supabase/migrations");

// Ordered list of migration files (schema-agnostic — SET search_path is injected below)
const MIGRATIONS = [
  "20260506000001_initial_schema.sql",
  "20260506000002_notifications_and_additions.sql",
  "20260507000003_roles_and_profile.sql",
  "20260509000004_kita_enrichment_cache.sql",
  "20260509000005_extended_parent_profile.sql",
  "20260510000006_children_extended.sql",
  "20260511000007_applications_fix_nullable_kita_id.sql",
];

// Target schemas (skipping dev — already set up)
const TARGET_SCHEMAS = ["kitaradar-test", "kitaradar-prod"];

// PostgreSQL error codes that are safe to ignore (already-exists idempotency)
const IGNORABLE_CODES = new Set([
  "42710", // duplicate_object (policy, index, etc.)
  "42P07", // duplicate_table
  "42P06", // duplicate_schema
  "42723", // duplicate_function
  "42P16", // invalid_table_definition (e.g. constraint already exists)
  "23505", // unique_violation (ON CONFLICT not supported in DDL context)
]);

async function runSql(statement) {
  // Split on semicolons, run each statement individually so one failure
  // (e.g. duplicate policy) doesn't abort the whole migration.
  const stmts = statement
    .split(/;/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^--/.test(s));

  for (const stmt of stmts) {
    try {
      await client.query(stmt + ";");
    } catch (err) {
      if (IGNORABLE_CODES.has(err.code)) {
        // Already exists — safe to skip
      } else {
        throw err;
      }
    }
  }
}

async function ensureSchema(schema) {
  await runSql(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  for (const role of ["anon", "authenticated", "service_role"]) {
    await runSql(`GRANT USAGE ON SCHEMA "${schema}" TO ${role}`);
  }
  console.log(`  ✓ Schema "${schema}" vorhanden`);
}

async function runMigration(schema, file) {
  const raw = readFileSync(join(MIGRATION_DIR, file), "utf-8");

  // Strip out any existing SET search_path lines so we control the path ourselves
  const cleaned = raw
    .split("\n")
    .filter((l) => !/^\s*SET\s+search_path/i.test(l))
    .join("\n");

  const script = `SET search_path TO "${schema}";\n${cleaned}`;
  await runSql(script);
  console.log(`    ✓ ${file}`);
}

async function grantPermissions(schema) {
  const grantSql = `
    GRANT SELECT, INSERT, UPDATE, DELETE
      ON ALL TABLES IN SCHEMA "${schema}" TO authenticated;
    GRANT SELECT
      ON ALL TABLES IN SCHEMA "${schema}" TO anon;
    GRANT ALL
      ON ALL TABLES IN SCHEMA "${schema}" TO service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}"
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}"
      GRANT SELECT ON TABLES TO anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}"
      GRANT ALL ON TABLES TO service_role;
  `;
  await runSql(grantSql);
  console.log(`  ✓ Berechtigungen gesetzt`);
}

async function seedData(schema) {
  // Demo-profile (needs a real auth.users UUID — we use a fixed test UUID here.
  // In Supabase, a real user must exist first for FK to auth.users to hold.
  // We use ON CONFLICT DO NOTHING so re-runs are safe.)
  const DEMO_PROFILE_ID = "00000000-0000-0000-0000-000000000001";

  const seedSql = `
    SET search_path TO "${schema}";

    -- Demo Profil (wird übersprungen falls auth-User nicht existiert)
    INSERT INTO profiles (id, email, full_name, subscription_tier)
    VALUES (
      '${DEMO_PROFILE_ID}',
      'demo@kitaradar-${schema.replace("kitaradar-", "")}.test',
      'Demo Nutzer',
      'pro'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Demo Bewerbungen
    INSERT INTO applications (profile_id, kita_name, kita_email, cover_letter, status, notes)
    VALUES
      (
        '${DEMO_PROFILE_ID}',
        'Kita Sonnenschein',
        'sonnenschein@kita-demo.de',
        'Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich um einen Kita-Platz für mein Kind.',
        'sent',
        NULL
      ),
      (
        '${DEMO_PROFILE_ID}',
        'Kita Regenbogen',
        'regenbogen@kita-demo.de',
        E'Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich um einen Kita-Platz.',
        'draft',
        'Termin für Besichtigung anfragen'
      ),
      (
        '${DEMO_PROFILE_ID}',
        'Städtische Kita Waldstraße',
        NULL,
        '',
        'response_received',
        'Positive Rückmeldung erhalten, Platz ab September'
      )
    ON CONFLICT DO NOTHING;
  `;

  try {
    await runSql(seedSql);
    console.log(`  ✓ Seed-Daten eingefügt (3 Demo-Bewerbungen)`);
  } catch (err) {
    // FK violation on auth.users is expected when no real user exists
    if (err.message?.includes("foreign key") || err.message?.includes("violates")) {
      console.log(`  ⚠  Seed-Daten übersprungen — kein auth-User mit der Demo-UUID vorhanden.`);
      console.log(`     Erstelle zuerst einen User in Supabase Auth und setze DEMO_PROFILE_ID`);
      console.log(`     in diesem Script auf dessen UUID.`);
    } else {
      throw err;
    }
  }
}

async function setupSchema(schema) {
  console.log(`\n📦  Schema: ${schema}`);
  await ensureSchema(schema);

  console.log(`  ⏳ Migrationen werden angewendet...`);
  for (const file of MIGRATIONS) {
    await runMigration(schema, file);
  }

  await grantPermissions(schema);
  await seedData(schema);
  console.log(`  ✅  ${schema} fertig`);
}

async function main() {
  console.log("🚀  KitaRadar Schema-Setup\n");
  console.log(`   Ziel-Schemas: ${TARGET_SCHEMAS.join(", ")}`);

  for (const schema of TARGET_SCHEMAS) {
    await setupSchema(schema);
  }

  await client.end();
  console.log("\n🎉  Alle Schemas erfolgreich eingerichtet!");
}

main().catch((err) => {
  console.error("\n❌  Fehler:", err.message ?? err);
  client.end();
  process.exit(1);
});

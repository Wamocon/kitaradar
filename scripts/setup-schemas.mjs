/**
 * Setup kitaradar-test and kitaradar-prod schemas
 *
 * 1. Applies all migrations (idempotent, skips already-existing objects)
 * 2. Copies all data from kitaradar-dev to each target schema
 *
 * Run:  node scripts/setup-schemas.mjs
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
const SOURCE_SCHEMA  = "kitaradar-dev";

// Tables to copy (order matters for FK constraints)
const DATA_TABLES = [
  "profiles",
  "children",
  "kitas",
  "applications",
  "feed_posts",
  "feed_reports",
  "subscriptions",
  "notifications",
  "kita_enrichments",
  "kita_reviews",
];

// PostgreSQL error codes that are safe to ignore (already-exists idempotency)
const IGNORABLE_CODES = new Set([
  "42710", // duplicate_object (policy, index, etc.)
  "42P07", // duplicate_table
  "42P06", // duplicate_schema
  "42723", // duplicate_function
  "42P16", // invalid_table_definition (e.g. constraint already exists)
  "42883", // undefined_function (trigger referencing function in another schema)
  "42501", // insufficient_privilege (e.g. auth schema triggers need superuser)
  "0A000", // feature_not_supported
  "55006", // object_in_use
]);

// Initialise client here so all functions can reference it
const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

/**
 * Split SQL source into individual statements, keeping $$ / $BODY$ dollar-quoted
 * blocks intact. Returns an array of statement strings (without trailing semicolons).
 */
function splitStatements(sql) {
  const stmts = [];
  let current = "";
  let inDollarQuote = false;
  let dollarTag = "";
  let i = 0;

  while (i < sql.length) {
    // Detect start/end of dollar-quote block ($$ or $tag$)
    if (!inDollarQuote && sql[i] === "$") {
      const end = sql.indexOf("$", i + 1);
      if (end !== -1) {
        const tag = sql.slice(i, end + 1);
        inDollarQuote = true;
        dollarTag = tag;
        current += tag;
        i = end + 1;
        continue;
      }
    } else if (inDollarQuote) {
      const close = sql.indexOf(dollarTag, i);
      if (close !== -1) {
        current += sql.slice(i, close + dollarTag.length);
        i = close + dollarTag.length;
        inDollarQuote = false;
        dollarTag = "";
        continue;
      } else {
        // unterminated dollar quote — append rest
        current += sql.slice(i);
        break;
      }
    }

    if (sql[i] === ";" && !inDollarQuote) {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith("--")) stmts.push(trimmed);
      current = "";
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith("--")) stmts.push(trimmed);

  return stmts;
}

async function runSql(statement) {
  const stmts = splitStatements(statement);
  for (const stmt of stmts) {
    try {
      await client.query(stmt);
    } catch (err) {
      if (IGNORABLE_CODES.has(err.code)) {
        // Already exists — safe to skip
      } else {
        throw new Error(`SQL error (${err.code ?? "?"}): ${err.message}\nStatement (first 300): ${stmt.slice(0, 300)}`);
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

// ── Phase 1b: Force-sync schema differences between dev and target ───────────
// Ensures nullable/column changes that migrations may have missed are applied.
async function forceSyncSchema(targetSchema) {
  // Sync every column's nullable from source to target
  const diffRes = await client.query(`
    SELECT
      t.table_name,
      t.column_name,
      s.is_nullable AS src_nullable,
      t.is_nullable AS tgt_nullable
    FROM information_schema.columns t
    JOIN information_schema.columns s
      ON s.table_schema = $1 AND s.table_name = t.table_name AND s.column_name = t.column_name
    WHERE t.table_schema = $2
      AND t.is_nullable <> s.is_nullable
  `, [SOURCE_SCHEMA, targetSchema]);

  for (const row of diffRes.rows) {
    const action = row.src_nullable === "YES" ? "DROP NOT NULL" : "SET NOT NULL";
    console.log(`    ↻ ${row.column_name}: ${row.tgt_nullable} → ${row.src_nullable} (${action})`);
    try {
      await client.query(
        `ALTER TABLE "${targetSchema}"."${row.table_name}" ALTER COLUMN "${row.column_name}" ${action}`
      );
    } catch (err) {
      console.log(`      ⚠ ${err.message} (übersprungen)`);
    }
  }

  // Add columns missing in target
  const missingRes = await client.query(`
    SELECT s.table_name, s.column_name, s.data_type,
           s.is_nullable, s.column_default, s.character_maximum_length
    FROM information_schema.columns s
    WHERE s.table_schema = $1
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns t
        WHERE t.table_schema = $2
          AND t.table_name = s.table_name
          AND t.column_name = s.column_name
      )
  `, [SOURCE_SCHEMA, targetSchema]);

  for (const row of missingRes.rows) {
    const nullable = row.is_nullable === "YES" ? "" : " NOT NULL";
    const def = row.column_default ? ` DEFAULT ${row.column_default}` : "";
    const typeStr = row.character_maximum_length
      ? `${row.data_type}(${row.character_maximum_length})`
      : row.data_type;
    console.log(`    + ${row.table_name}.${row.column_name} (${typeStr}${nullable})`);
    try {
      await client.query(
        `ALTER TABLE "${targetSchema}"."${row.table_name}"
         ADD COLUMN IF NOT EXISTS "${row.column_name}" ${typeStr}${def}${nullable}`
      );
    } catch (err) {
      console.log(`      ⚠ ${err.message} (übersprungen)`);
    }
  }

  if (diffRes.rowCount + missingRes.rowCount === 0) {
    console.log(`    ✓ Schema bereits synchron`);
  }
}

// ── Phase 1c: Fix known constraint mismatches ────────────────────────────────
// Repairs constraints that plain migration idempotency can't handle cleanly.
async function fixConstraints(schema) {
  // Fix applications.status CHECK — drop any old constraint and recreate with all values
  await client.query(`
    DO $$
    DECLARE cname text;
    BEGIN
      FOR cname IN
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_schema = '${schema}'
          AND table_name   = 'applications'
          AND constraint_type = 'CHECK'
          AND constraint_name LIKE '%status%'
      LOOP
        EXECUTE 'ALTER TABLE "${schema}".applications DROP CONSTRAINT ' || quote_ident(cname);
      END LOOP;
      -- Recreate with full value set
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = '${schema}' AND table_name = 'applications'
          AND constraint_name = 'applications_status_check'
      ) THEN
        ALTER TABLE "${schema}".applications
          ADD CONSTRAINT applications_status_check
          CHECK (status IN ('draft','sent','waiting','response_received','positive','rejected','negative'));
      END IF;
    END $$;
  `);
  console.log(`    ✓ applications_status_check aktualisiert`);
}
async function tableExists(schema, table) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
    [schema, table]
  );
  return res.rowCount > 0;
}

async function copyTable(targetSchema, table) {
  const exists = await tableExists(targetSchema, table);
  if (!exists) {
    console.log(`    ⚠  "${table}" nicht in "${targetSchema}" — übersprungen`);
    return;
  }

  // Check source row count
  const sourceExists = await tableExists(SOURCE_SCHEMA, table);
  if (!sourceExists) {
    console.log(`    ⚠  "${table}" nicht in "${SOURCE_SCHEMA}" — übersprungen`);
    return;
  }

  const countRes = await client.query(`SELECT count(*) FROM "${SOURCE_SCHEMA}"."${table}"`);
  const total = parseInt(countRes.rows[0].count, 10);
  if (total === 0) {
    console.log(`    –  "${table}" leer — übersprungen`);
    return;
  }

  // Get columns that exist in BOTH source and target (intersection)
  const colRes = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $3
     INTERSECT
     SELECT column_name FROM information_schema.columns
     WHERE table_schema = $2 AND table_name = $3`,
    [SOURCE_SCHEMA, targetSchema, table]
  );
  if (colRes.rowCount === 0) {
    console.log(`    ⚠  "${table}": keine gemeinsamen Spalten — übersprungen`);
    return;
  }
  const cols = colRes.rows.map((r) => `"${r.column_name}"`).join(", ");

  // Truncate target (CASCADE to handle FK child rows), then insert from source
  await client.query(`TRUNCATE TABLE "${targetSchema}"."${table}" CASCADE`);
  await client.query(
    `INSERT INTO "${targetSchema}"."${table}" (${cols})
     SELECT ${cols} FROM "${SOURCE_SCHEMA}"."${table}"`
  );
  console.log(`    ✓ "${table}": ${total} Zeile(n) kopiert`);
}

async function setupSchema(schema) {
  console.log(`\n📦  Schema: ${schema}`);
  await ensureSchema(schema);

  console.log(`  ⏳ Migrationen werden angewendet...`);
  for (const file of MIGRATIONS) {
    await runMigration(schema, file);
  }
  await grantPermissions(schema);

  // Phase 1b: Force-sync any schema differences (nullable, missing columns)
  console.log(`  ⏳ Schema-Sync mit "${SOURCE_SCHEMA}"...`);
  await forceSyncSchema(schema);
  await fixConstraints(schema);

  console.log(`  ⏳ Daten von "${SOURCE_SCHEMA}" kopieren...`);
  for (const table of DATA_TABLES) {
    await copyTable(schema, table);
  }

  console.log(`  ✅  ${schema} fertig`);
}

async function main() {
  console.log("🚀  KitaRadar Schema-Setup & Datenmigration\n");
  console.log(`   Quelle:  ${SOURCE_SCHEMA}`);
  console.log(`   Ziele:   ${TARGET_SCHEMAS.join(", ")}\n`);

  await client.connect();

  for (const schema of TARGET_SCHEMAS) {
    await setupSchema(schema);
  }

  await client.end();
  console.log("\n🎉  Alle Schemas erfolgreich eingerichtet und befüllt!");
}

main().catch(async (err) => {
  console.error("\n❌  Fehler:", err.message ?? err);
  await client.end().catch(() => {});
  process.exit(1);
});

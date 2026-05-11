import { Client } from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(__dirname, "../supabase/migrations/20260511000007_applications_fix_nullable_kita_id.sql"),
  "utf8"
);

const client = new Client({
  connectionString:
    "SUPABASE_DB_URL_REDACTED",
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query('SET search_path TO "kitaradar-dev"');
await client.query(sql);
console.log("✓ Migration 007 erfolgreich angewendet.");

const cols = await client.query(`
  SELECT column_name, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'kitaradar-dev' AND table_name = 'applications'
  ORDER BY ordinal_position
`);
console.log("Spalten:");
cols.rows.forEach((r) =>
  console.log(`  ${r.column_name} | nullable: ${r.is_nullable} | default: ${r.column_default}`)
);

const chk = await client.query(`
  SELECT constraint_name, check_clause
  FROM information_schema.check_constraints
  WHERE constraint_schema = 'kitaradar-dev' AND constraint_name LIKE '%status%'
`);
console.log("Status-Constraint:", JSON.stringify(chk.rows, null, 2));

await client.end();

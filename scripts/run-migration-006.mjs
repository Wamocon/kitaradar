/**
 * One-time migration script: Erweitert die children-Tabelle um birth_year, birth_month, special_needs
 * und macht date_of_birth nullable.
 * Run: node scripts/run-migration-006.mjs
 */
import https from "https";

const SERVICE_ROLE_KEY =
  "REMOVED_SERVICE_ROLE_KEY";

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const req = https.request(
      {
        hostname: "xfbbxjbsfsopfxonrbmv.supabase.co",
        path: "/rest/v1/rpc/exec",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_ROLE_KEY,
          Authorization: "Bearer " + SERVICE_ROLE_KEY,
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

const steps = [
  `ALTER TABLE "kitaradar-dev".children ALTER COLUMN date_of_birth DROP NOT NULL`,
  `ALTER TABLE "kitaradar-dev".children ADD COLUMN IF NOT EXISTS birth_year INTEGER`,
  `ALTER TABLE "kitaradar-dev".children ADD COLUMN IF NOT EXISTS birth_month INTEGER`,
  `ALTER TABLE "kitaradar-dev".children ADD COLUMN IF NOT EXISTS special_needs TEXT`,
  `UPDATE "kitaradar-dev".children SET birth_year = EXTRACT(YEAR FROM date_of_birth)::INTEGER, birth_month = EXTRACT(MONTH FROM date_of_birth)::INTEGER WHERE date_of_birth IS NOT NULL AND birth_year IS NULL`,
];

for (const sql of steps) {
  const shortSql = sql.substring(0, 70);
  const result = await runSQL(sql);
  if (result.status === 200 || result.status === 204) {
    console.log("OK  ", shortSql);
  } else {
    console.error("ERR", result.status, shortSql, result.body.substring(0, 200));
  }
}

console.log("Done.");


const https = require("https");

// Read secrets from environment variables — never hardcode tokens in source.
// Set these before running: VERCEL_TOKEN, GH_TOKEN
const VERCEL_TOKEN  = process.env.VERCEL_TOKEN;
const VERCEL_TEAM   = "team_3KLIxWWTDEzyuitA2oGwAorz";
const VERCEL_PROJ   = "prj_hgK5ciHPRPrZD8prScINjsT1zzzf";
const GH_TOKEN      = process.env.GH_TOKEN;
const GH_OWNER      = "Wamocon";
const GH_REPO       = "kitaradar";

if (!VERCEL_TOKEN || !GH_TOKEN) {
  console.error("Error: VERCEL_TOKEN and GH_TOKEN must be set as environment variables.");
  console.error("  $env:VERCEL_TOKEN='vcp_...'");
  console.error("  $env:GH_TOKEN='ghp_...'");
  process.exit(1);
}

function req(options, body) {
  return new Promise((res, rej) => {
    const r = https.request(options, resp => {
      let d = "";
      resp.on("data", c => d += c);
      resp.on("end", () => {
        try { res({ status: resp.statusCode, body: JSON.parse(d) }); }
        catch { res({ status: resp.statusCode, body: d }); }
      });
    });
    r.on("error", rej);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function vercelDeleteEnv(key) {
  const list = await req({ hostname:"api.vercel.com", path:`/v9/projects/${VERCEL_PROJ}/env?teamId=${VERCEL_TEAM}`, headers:{"Authorization":"Bearer "+VERCEL_TOKEN} });
  for (const e of (list.body.envs||[]).filter(x=>x.key===key)) {
    await req({ method:"DELETE", hostname:"api.vercel.com", path:`/v9/projects/${VERCEL_PROJ}/env/${e.id}?teamId=${VERCEL_TEAM}`, headers:{"Authorization":"Bearer "+VERCEL_TOKEN} });
  }
}

async function vercelSetEnv(key, value, targets, type="plain") {
  await vercelDeleteEnv(key);
  for (const target of targets) {
    const r = await req({ method:"POST", hostname:"api.vercel.com", path:`/v10/projects/${VERCEL_PROJ}/env?teamId=${VERCEL_TEAM}`, headers:{"Authorization":"Bearer "+VERCEL_TOKEN,"Content-Type":"application/json"} }, { key, value, type, target:[target] });
    console.log(r.status===200?"  OK":"  ERR", key, `[${target}]`, type, r.status!==200?JSON.stringify(r.body):"");
  }
}

async function ghSetSecret(name, value) {
  // 1. Get public key
  const pk = await req({ hostname:"api.github.com", path:`/repos/${GH_OWNER}/${GH_REPO}/actions/secrets/public-key`, headers:{"Authorization":"token "+GH_TOKEN,"User-Agent":"kitaradar-setup"} });
  const { key_id, key: pubKeyB64 } = pk.body;
  // 2. Encrypt with libsodium
  const sodium = require("libsodium-wrappers");
  await sodium.ready;
  const encBytes = sodium.crypto_box_seal(Buffer.from(value), Buffer.from(pubKeyB64,"base64"));
  const encVal   = Buffer.from(encBytes).toString("base64");
  // 3. Set secret
  const r = await req({ method:"PUT", hostname:"api.github.com", path:`/repos/${GH_OWNER}/${GH_REPO}/actions/secrets/${name}`, headers:{"Authorization":"token "+GH_TOKEN,"User-Agent":"kitaradar-setup","Content-Type":"application/json"} }, { encrypted_value: encVal, key_id });
  console.log(r.status<300?"  OK":"  ERR", name, r.status, r.status>=300?JSON.stringify(r.body):"");
}

(async()=>{
  console.log("\n[1] Vercel: NEXT_PUBLIC_SUPABASE_SCHEMA per env");
  await vercelSetEnv("NEXT_PUBLIC_SUPABASE_SCHEMA","kitaradar-dev",  ["development"]);
  await vercelSetEnv("NEXT_PUBLIC_SUPABASE_SCHEMA","kitaradar-test", ["preview"]);
  await vercelSetEnv("NEXT_PUBLIC_SUPABASE_SCHEMA","kitaradar-prod", ["production"]);

  console.log("\n[2] Vercel: NEXT_PUBLIC_APP_URL per env");
  await vercelSetEnv("NEXT_PUBLIC_APP_URL","http://localhost:3000",        ["development"]);
  await vercelSetEnv("NEXT_PUBLIC_APP_URL","https://kitaradar.vercel.app", ["preview","production"]);

  console.log("\n[3] GitHub Secret: VERCEL_PROJECT_ID");
  await ghSetSecret("VERCEL_PROJECT_ID", VERCEL_PROJ);

  console.log("\n[4] Vercel env list:");
  const all = await req({ hostname:"api.vercel.com", path:`/v9/projects/${VERCEL_PROJ}/env?teamId=${VERCEL_TEAM}`, headers:{"Authorization":"Bearer "+VERCEL_TOKEN} });
  for (const e of (all.body.envs||[]).sort((a,b)=>a.key.localeCompare(b.key))) {
    console.log(`  ${e.key.padEnd(36)} [${(e.target||[]).join(",")}]  ${e.type}`);
  }
  console.log("\nDone.");
})();
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "kitaradar-dev";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    db: { schema },
  });
}

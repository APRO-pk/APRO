import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const missingEnvVars = [
  !supabaseUrl ? "VITE_SUPABASE_URL" : null,
  !supabaseAnonKey ? "VITE_SUPABASE_ANON_KEY" : null,
].filter(Boolean) as string[];

export const supabaseConfigError =
  missingEnvVars.length > 0
    ? `Missing required environment variable${missingEnvVars.length > 1 ? "s" : ""}: ${missingEnvVars.join(
        ", "
      )}. Add them to Cloudflare before building the site.`
    : null;

if (supabaseConfigError) {
  console.error("[APRO] Supabase configuration error:", supabaseConfigError);
}

export const supabase = supabaseConfigError
  ? (null as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl!, supabaseAnonKey!);

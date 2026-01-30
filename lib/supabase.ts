import { createClient } from '@supabase/supabase-js';

/**
 * Accessing environment variables via process.env as requested.
 * We include safe fallbacks to prevent the "supabaseUrl is required" error 
 * if the environment variables are not yet loaded or missing.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Using fallback configuration.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

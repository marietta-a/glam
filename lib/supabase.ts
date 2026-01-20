import { createClient } from '@supabase/supabase-js';

/**
 * Accessing environment variables via process.env as requested.
 * We include safe fallbacks to prevent the "supabaseUrl is required" error 
 * if the environment variables are not yet loaded or missing.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Project defaults to ensure the app doesn't crash during initialization
const FALLBACK_URL = 'https://pqdqdmbuebafmkpuyeec.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZHFkbWJ1ZWJhZm1rcHV5ZWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODAxMzIsImV4cCI6MjA4Mzg1NjEzMn0.cCTLRt4eAag3qL6x7iKK1816aVQ-D233BzZCZPlnN4E';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Using fallback configuration.");
}

export const supabase = createClient(
  supabaseUrl || FALLBACK_URL,
  supabaseAnonKey || FALLBACK_KEY
);

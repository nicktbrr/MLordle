import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the app has been configured with Supabase credentials. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Created lazily-ish: if env vars are missing we still export a client built from
// empty strings so imports don't throw; callers should gate on isSupabaseConfigured.
export const supabase = createClient(url ?? '', anonKey ?? '');

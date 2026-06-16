import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Supabase publishable key (sb_publishable_...). Public-safe; protected by RLS.
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** True when the app has been configured with Supabase credentials. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

// Created lazily-ish: if env vars are missing we still export a client built from
// empty strings so imports don't throw; callers should gate on isSupabaseConfigured.
export const supabase = createClient(url ?? '', publishableKey ?? '');

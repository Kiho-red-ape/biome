import { createClient } from '@supabase/supabase-js';

/** Anon-key client for server components — public reads only. */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

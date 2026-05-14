// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
//
// Kept for reading existing Supabase Storage media (rows with
// `Media.host = StorageLocation.SUPABASE`). Realtime usage is removed —
// realtime is Ably. This entire client is scheduled for removal in the
// Cloudflare R2 migration; do not add new callers.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazily constructed. Building the client eagerly at module scope
// crashes `next build` page-data collection when the Supabase env
// vars aren't present in the build environment — and they shouldn't
// need to be, since this is a read-only legacy path.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

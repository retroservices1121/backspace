// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
//
// Kept for reading existing Supabase Storage media (rows with
// `Media.host = StorageLocation.SUPABASE`). Realtime usage is removed —
// realtime is Ably. This entire client is scheduled for removal in the
// Cloudflare R2 migration; do not add new callers.

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

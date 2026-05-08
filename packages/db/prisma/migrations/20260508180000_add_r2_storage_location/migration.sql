-- Add R2 to the StorageLocation enum so newly-uploaded media rows
-- can record that they live in Cloudflare R2 instead of Firebase
-- Storage. Existing rows stay on FIREBASE/SUPABASE/URL/NONE.
ALTER TYPE "StorageLocation" ADD VALUE 'R2';

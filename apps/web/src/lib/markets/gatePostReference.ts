import prisma from '@src/api2/prisma';

let ready: Promise<void> | null = null;

/**
 * Railway normally applies the checked-in migration before startup. This
 * idempotent guard also covers environments that override the Docker CMD.
 */
export function ensureGatePostReference(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "gateMarketId" TEXT',
      );
      await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "Post_gateMarketId_idx" ON "Post"("gateMarketId")',
      );
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

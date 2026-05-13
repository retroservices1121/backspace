// Shared Prisma client. Mirrors apps/web/src/api2/prisma.ts so the two
// apps point at the same singleton in dev (no double-connection warnings).
import { prisma } from '@backspace/db';

export default prisma;

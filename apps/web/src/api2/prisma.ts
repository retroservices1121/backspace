// Re-exports the shared Prisma client from @backspace/db so apps/web and
// apps/admin both read from the same singleton wired to the same schema.
import { prisma } from '@backspace/db';

export default prisma;

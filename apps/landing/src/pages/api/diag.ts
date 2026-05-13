// Diagnostic endpoint. Returns the live status of the env vars and the
// database connection from inside the running container. Lets us
// diagnose deploy issues without needing access to Railway logs.
//
// TODO: remove once the deploy is stable. The info isn't sensitive
// (env var values are not echoed, just whether they're set), but it
// is more than a marketing site should expose long-term.
import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@src/lib/prisma';

type Check =
  | { tried: false }
  | { tried: true; ok: true; detail?: unknown }
  | { tried: true; ok: false; error: string; name?: string; code?: string };

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const env = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'MISSING',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'set' : 'missing',
    EMAIL_FROM: process.env.EMAIL_FROM ? 'set' : 'missing',
    IP_HASH_SALT: process.env.IP_HASH_SALT ? 'set' : 'missing',
    NODE_ENV: process.env.NODE_ENV ?? 'unset',
  };

  // SELECT 1 — does Prisma reach the DB at all?
  let dbPing: Check = { tried: false };
  try {
    const r = await prisma.$queryRaw<Array<{ one: number }>>`SELECT 1 as one`;
    dbPing = { tried: true, ok: true, detail: r };
  } catch (err) {
    dbPing = errCheck(err);
  }

  // Does the WaitlistEntry table exist + is queryable?
  let tableCheck: Check = { tried: false };
  try {
    const count = await prisma.waitlistEntry.count();
    tableCheck = { tried: true, ok: true, detail: { count } };
  } catch (err) {
    tableCheck = errCheck(err);
  }

  return res.status(200).json({ env, dbPing, tableCheck });
}

function errCheck(err: unknown): Check {
  if (err instanceof Error) {
    const out: Check = {
      tried: true,
      ok: false,
      error: err.message,
      name: err.name,
    };
    // Prisma errors carry a `code` like P1001 (can't reach), P1003 (db
    // does not exist), P2021 (table does not exist), etc.
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string') out.code = code;
    return out;
  }
  return { tried: true, ok: false, error: String(err) };
}

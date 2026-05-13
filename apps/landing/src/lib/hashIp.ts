import { createHash } from 'crypto';

// Hash the IP before persisting it. We want some abuse signal (multiple
// reservations from one host) without keeping plaintext IPs in the DB.
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'backspace-landing-default-salt';
  return createHash('sha256').update(salt).update(ip).digest('hex').slice(0, 32);
}

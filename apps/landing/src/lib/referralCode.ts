import { customAlphabet } from 'nanoid';

// Avoid ambiguous glyphs (0/O, 1/I/l) so codes are speakable.
const generator = customAlphabet('23456789ABCDEFGHJKMNPQRSTUVWXYZ', 8);

export function newReferralCode(): string {
  return generator();
}

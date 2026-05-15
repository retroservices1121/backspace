// Amount conversion helpers — Dflow quote/swap deal in atomic units
// (lamports for SOL, integer base units for SPL tokens), but the UI
// shows human-decimal amounts. Kept tiny and dep-free so the swap
// card can import without pulling Solana web3 into the bundle.

/** Human decimal "1.5" + decimals 9 → atomic "1500000000". */
export function toAtomicAmount(human: string | number, decimals: number): string {
  const s = String(human).trim();
  if (!s || s === '.') return '0';
  if (!/^\d*\.?\d*$/.test(s)) {
    throw new Error(`Invalid amount: ${s}`);
  }
  const [whole = '0', frac = ''] = s.split('.');
  // Truncate fractional digits beyond `decimals` (don't round — the
  // user's input is the cap).
  const fracTruncated = frac.slice(0, decimals);
  const fracPadded = fracTruncated.padEnd(decimals, '0');
  const combined = (whole + fracPadded).replace(/^0+/, '') || '0';
  return combined;
}

/** Atomic "1500000000" + decimals 9 → human "1.5" (no trailing zeros). */
export function fromAtomicAmount(atomic: string | number, decimals: number): string {
  const s = String(atomic).trim();
  if (!s) return '0';
  if (decimals === 0) return s;
  const padded = s.padStart(decimals + 1, '0');
  const whole = padded.slice(0, padded.length - decimals);
  const frac = padded.slice(padded.length - decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

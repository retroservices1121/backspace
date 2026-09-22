// Keep return destinations explicit: never navigate to an arbitrary query URL.
export const MARKETS_PATH = '/markets';
export const MARKETS_LOGIN = '/auth/login?next=%2Fmarkets';

export function isMarketsEntry(pathname: string): boolean {
  return pathname === MARKETS_PATH;
}

export function afterSignIn(next: unknown): string {
  return next === MARKETS_PATH ? MARKETS_PATH : '/';
}

export function marketsOnboarding(pathname: string, next: unknown): string {
  return isMarketsEntry(pathname) || afterSignIn(next) === MARKETS_PATH
    ? '/auth/onboarding?next=%2Fmarkets'
    : '/auth/onboarding';
}


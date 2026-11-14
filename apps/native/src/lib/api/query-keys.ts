/** TanStack Query keys for Backspace API data. Keep every key here so invalidation stays consistent. */
export const queryKeys = {
  me: ['me'] as const,
  portfolio: (userId: string | undefined) => ['gate-portfolio', userId] as const,
};

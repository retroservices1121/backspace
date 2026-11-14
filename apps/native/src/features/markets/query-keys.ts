/** TanStack Query keys for Gate/markets data. Kept inside the markets feature so no market key leaks into social code. */
export const marketQueryKeys = {
  portfolio: (userId: string | undefined) => ['gate-portfolio', userId] as const,
};

// Shared types used across apps/web and apps/admin.
// Domain types come from @backspace/db (Prisma) — keep this file for cross-app
// concerns that are not derivable from the schema (e.g. API request shapes,
// pagination wrappers, feature flags).

export type Paginated<T> = {
  items: T[];
  cursor: string | null;
};

/**
 * Replaces all keys defined in override on the base type.
 */
export type Override<Base, Overrides> = Omit<Base, keyof Overrides> & Overrides;

export type Response<E extends (...args : any) => Promise<any>> = Awaited<ReturnType<E>>;

/** Used in conjunction with NextConnect and the ApiClient */
export type Rest<Q = string, B = {}> = {
  query: Q extends string ? { id : string } : Q;
  body: B;
  authId: string;
};

// Suck it prisma, this is how you should work.
export type With<Base, FullIncludes, Includes = {}> = Base & {
  [K in keyof Includes]: K extends keyof FullIncludes ? FullIncludes[K] : unknown;
};

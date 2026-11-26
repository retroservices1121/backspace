// Server-only entry: `@backspace/markets/server`.
//
// Import ONLY from Next.js API routes or server-only modules under
// apps/web/src/pages/api or apps/web/src/lib. Never from components,
// hooks, pages that render in the browser, or apps/native.

if (typeof window !== 'undefined') {
  throw new Error('@backspace/markets/server is server-only and must not be bundled for the browser.');
}

export * from './broker';

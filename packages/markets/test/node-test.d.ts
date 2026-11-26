// Minimal `node:test` declarations for the test build. The package pins
// @types/node 17, which predates node:test (Node 18). Only what the tests use.
declare module 'node:test' {
  type TestFn = () => void | Promise<void>;
  export function test(name: string, fn: TestFn): Promise<void>;
  export function afterEach(fn: TestFn): void;
}

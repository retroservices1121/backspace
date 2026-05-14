#!/usr/bin/env node
/*
 * Strip the `exports` field from @types/react's package.json so Next 12's
 * verifyTypeScriptSetup can resolve `@types/react/index.d.ts` via
 * Node's legacy path-based resolution.
 *
 * Background: @types/react 17.0.83+ added an `exports` map that maps
 * only the package root ("."), so `require.resolve('@types/react/index.d.ts')`
 * throws ERR_PACKAGE_PATH_NOT_EXPORTED. Next 12 (any patch) probes for
 * that exact subpath in its dependency pre-flight and fails the build
 * with the cryptic "Please install @types/react" message even though
 * @types/react is fully installed.
 *
 * Next 13+ removed the subpath probe, but upgrading apps/web from 12 to
 * 13/14 is out of scope. Removing the `exports` field here is the
 * smallest, most reversible workaround.
 *
 * Run after `pnpm install`, before `next build`. Idempotent — safe to
 * re-run.
 */
const fs = require('fs');
const path = require('path');

function findPackageJsons(start) {
  const pnpmDir = path.join(start, 'node_modules', '.pnpm');
  if (!fs.existsSync(pnpmDir)) {
    return [];
  }
  return fs
    .readdirSync(pnpmDir)
    .filter((dir) => dir.startsWith('@types+react@'))
    .map((dir) =>
      path.join(
        pnpmDir,
        dir,
        'node_modules',
        '@types',
        'react',
        'package.json',
      ),
    )
    .filter((p) => fs.existsSync(p));
}

// Repo root is two levels up from apps/web/scripts.
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const targets = findPackageJsons(repoRoot);

if (targets.length === 0) {
  console.warn(
    '[fix-types-react-exports] No @types/react found under node_modules/.pnpm. Skipping.',
  );
  process.exit(0);
}

let changed = 0;
for (const pkgPath of targets) {
  const raw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  if (pkg.exports) {
    delete pkg.exports;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('[fix-types-react-exports] stripped exports from', pkgPath);
    changed += 1;
  }
}

if (changed === 0) {
  console.log(
    '[fix-types-react-exports] No exports field to strip (already done or not present).',
  );
}

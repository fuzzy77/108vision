/**
 * Build Script — Compile and bundle 108 AI desktop agent for distribution.
 *
 * Usage:
 *   node scripts/build.js
 *   node scripts/build.js --production
 */

import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const isProduction = process.argv.includes('--production');
const outDir = join(projectRoot, 'dist');
const outFile = join(outDir, '108ai.mjs');

async function main() {
  console.log('--- 108 AI — Desktop Agent Build ---');
  console.log(`Mode: ${isProduction ? 'production' : 'development'}`);

  // Clean output directory
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true });
  }
  mkdirSync(outDir, { recursive: true });

  // Step 1: Type check
  console.log('\n[1/3] Type checking...');
  try {
    execSync('npx tsc --noEmit', { cwd: projectRoot, stdio: 'pipe' });
    console.log('      Types OK');
  } catch (error) {
    console.error('      Type check failed:');
    if (error instanceof Error && 'stdout' in error) {
      console.error(error.stdout?.toString());
    }
    process.exit(1);
  }

  // Step 2: Bundle with esbuild
  console.log('[2/3] Bundling with esbuild...');
  try {
    const result = await build({
      entryPoints: [join(projectRoot, 'src', 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: outFile,
      minify: isProduction,
      sourcemap: !isProduction,
      banner: {
        js: '#!/usr/bin/env node\n',
      },
      external: [
        'chokidar',
        'clipboardy',
        'node-notifier',
        'open',
        'ws',
        'node:*',
        'fs',
        'path',
        'os',
        'crypto',
        'child_process',
        'readline',
        'url',
        'util',
      ],
      define: {
        'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
      },
      logLevel: 'info',
    });

    if (result.errors.length > 0) {
      console.error('      Bundle errors:', result.errors);
      process.exit(1);
    }

    console.log(`      Bundle: ${outFile}`);
  } catch (error) {
    console.error('      Bundle failed:', error);
    process.exit(1);
  }

  // Step 3: Summary
  console.log('[3/3] Build complete');
  console.log(`\n  Output: ${outFile}`);
  console.log('  Run with: node dist/108ai.mjs');

  if (isProduction) {
    console.log('\n  For native packaging (optional):');
    console.log('    npx pkg dist/108ai.mjs --targets node20-win-x64 --output dist/108ai.exe');
    console.log('    npx pkg dist/108ai.mjs --targets node20-macos-x64 --output dist/108ai-macos');
    console.log('    npx pkg dist/108ai.mjs --targets node20-linux-x64 --output dist/108ai-linux');
  }
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

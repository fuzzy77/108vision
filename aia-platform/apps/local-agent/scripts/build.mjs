/**
 * Build Script — Compiles the Desktop Agent into standalone executables.
 *
 * Uses Bun's compile feature to create single-file binaries.
 * Targets: Windows (x64), macOS (x64 + arm64), Linux (x64)
 *
 * Usage:
 *   node scripts/build.mjs                    # Build for current platform
 *   node scripts/build.mjs --all              # Build all platforms
 *   node scripts/build.mjs --platform windows # Build specific platform
 */

import { execSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST_DIR = join(ROOT, 'dist', 'bin');
const ENTRY = join(ROOT, 'src', 'index.ts');
const APP_NAME = '108ai';

const TARGETS = {
  'windows-x64':  { bunTarget: 'bun-windows-x64',  output: `${APP_NAME}.exe` },
  'macos-x64':    { bunTarget: 'bun-darwin-x64',    output: `${APP_NAME}-macos-x64` },
  'macos-arm64':  { bunTarget: 'bun-darwin-arm64',  output: `${APP_NAME}-macos-arm64` },
  'linux-x64':    { bunTarget: 'bun-linux-x64',     output: `${APP_NAME}-linux-x64` },
};

function getCurrentPlatform() {
  const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  return `${platform}-${arch}`;
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--all')) {
    return Object.keys(TARGETS);
  }

  const platformIdx = args.indexOf('--platform');
  if (platformIdx !== -1 && args[platformIdx + 1]) {
    const requested = args[platformIdx + 1];
    const matches = Object.keys(TARGETS).filter(t => t.startsWith(requested));
    if (matches.length === 0) {
      console.error(`Unknown platform: ${requested}. Available: ${Object.keys(TARGETS).join(', ')}`);
      process.exit(1);
    }
    return matches;
  }

  // Default: current platform only
  return [getCurrentPlatform()];
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function build(targets) {
  // Ensure dist directory
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
  }

  console.log(`\n  108 AI Desktop Agent — Build\n`);
  console.log(`  Entry:   ${ENTRY}`);
  console.log(`  Output:  ${DIST_DIR}`);
  console.log(`  Targets: ${targets.join(', ')}\n`);

  for (const target of targets) {
    const config = TARGETS[target];
    if (!config) {
      console.error(`  ✗ Unknown target: ${target}`);
      continue;
    }

    const outputPath = join(DIST_DIR, config.output);
    console.log(`  Building ${target}...`);

    try {
      const cmd = [
        'bun', 'build',
        '--compile',
        `--target=${config.bunTarget}`,
        `--outfile=${outputPath}`,
        '--external', 'link-preview-js',
        ENTRY,
      ].join(' ');

      execSync(cmd, {
        cwd: ROOT,
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production' },
      });

      const stats = statSync(outputPath);
      console.log(`  ✓ ${config.output} (${formatSize(stats.size)})`);
    } catch (error) {
      console.error(`  ✗ ${target} failed: ${error.message}`);

      // Fallback: try esbuild bundle (not compiled, but at least produces a single JS file)
      console.log(`    Falling back to esbuild bundle...`);
      try {
        const bundlePath = join(DIST_DIR, `${APP_NAME}-bundle.js`);
        execSync(
          `npx esbuild ${ENTRY} --bundle --platform=node --format=esm --outfile=${bundlePath} --external:@aia/desktop-bridge`,
          { cwd: ROOT, stdio: 'pipe' }
        );
        console.log(`    ✓ Fallback bundle: ${bundlePath}`);
      } catch (e2) {
        console.error(`    ✗ Fallback also failed: ${e2.message}`);
      }
    }
  }

  console.log(`\n  Done.\n`);
}

const targets = parseArgs();
build(targets);

/**
 * Package beta release artifacts for PMI distribution.
 *
 * Usage:
 *   node scripts/package-beta.mjs
 *
 * Output: dist/release/108ai-beta-<platform>-<version>/
 */

import { execSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST_BIN = join(ROOT, 'dist', 'bin');
const RELEASE_DIR = join(ROOT, 'dist', 'release');

function readVersion(): string {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as { version: string };
  return pkg.version;
}

function platformTag(): string {
  const p = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
  const a = process.arch === 'arm64' ? 'arm64' : 'x64';
  return `${p}-${a}`;
}

function findBinary(): string | null {
  const names = [
    '108ai-agent.exe',
    '108ai-agent',
    '108ai-agent-linux-x64',
    '108ai-agent-macos-x64',
    '108ai-agent-macos-arm64',
  ];
  for (const name of names) {
    const path = join(DIST_BIN, name);
    if (existsSync(path)) return path;
  }
  return null;
}

function main(): void {
  const version = readVersion();
  const tag = platformTag();
  const outDir = join(RELEASE_DIR, `108ai-beta-${tag}-v${version}`);

  console.log('\n  108 AI — Beta package\n');

  if (!existsSync(DIST_BIN)) {
    mkdirSync(DIST_BIN, { recursive: true });
  }

  let binary = findBinary();
  if (!binary) {
    console.log('  Building binary (current platform)...');
    execSync('node scripts/build.mjs', { cwd: ROOT, stdio: 'inherit' });
    binary = findBinary();
  }

  if (!binary) {
    console.error('  [ERR] Nessun binary in dist/bin. Esegui: pnpm run build:bin');
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const targetName = process.platform === 'win32' ? '108ai.exe' : '108ai';
  const targetPath = join(outDir, targetName);
  copyFileSync(binary, targetPath);

  const readme = `# 108 AI Desktop Agent — Beta v${version}

## Installazione rapida (Windows)

1. Estrai questa cartella
2. Tasto destro su \`install-108ai.ps1\` → Esegui con PowerShell
3. Completa il login nel browser
4. L'agent resta in system tray; triage mattutino lun-ven 07:00 attivo

## Installazione manuale

\`\`\`
./${targetName} --install
./${targetName} agent
\`\`\`

## Comandi

| Comando | Descrizione |
|---------|-------------|
| \`108ai\` | Shell interattiva |
| \`108ai agent\` | Background + tray |
| \`108ai --install\` | Ripara PATH / autostart |
| \`108ai --uninstall\` | Rimuovi autostart |

Dati: \`~/.108ai/\`
`;

  writeFileSync(join(outDir, 'README-BETA.md'), readme, 'utf-8');

  const psInstaller = join(ROOT, 'scripts', 'windows', 'install-108ai.ps1');
  if (existsSync(psInstaller)) {
    copyFileSync(psInstaller, join(outDir, 'install-108ai.ps1'));
  }

  console.log(`  [OK] ${outDir}`);
  console.log(`  Binary: ${targetName}\n`);
}

main();

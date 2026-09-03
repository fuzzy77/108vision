#!/usr/bin/env node
/**
 * dev.mjs — Cross-platform dev script for AIA Platform.
 * Works on Windows (PowerShell/cmd), macOS, and Linux without bash.
 *
 * Usage:
 *   node scripts/dev.mjs              Start everything (infra + build + apps)
 *   node scripts/dev.mjs --skip-infra Start apps only (Docker already running)
 *   node scripts/dev.mjs --stop       Stop everything
 *   node scripts/dev.mjs --status     Show status with health checks
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PID_FILE = resolve(ROOT, '.dev-pids.json');

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (msg) => console.log(`${C.blue}[dev]${C.reset} ${msg}`);
const ok = (msg) => console.log(`${C.green}[ OK ]${C.reset} ${msg}`);
const warn = (msg) => console.log(`${C.yellow}[WARN]${C.reset} ${msg}`);
const err = (msg) => console.log(`${C.red}[ERR ]${C.reset} ${msg}`);

// --- PID Management ---

function loadPids() {
  if (!existsSync(PID_FILE)) return [];
  try {
    return JSON.parse(readFileSync(PID_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function savePids(pids) {
  writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function killProcess(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
    return true;
  } catch {
    return false;
  }
}

// --- Health Checks ---

async function checkHealth(name, url, timeoutMs = 3000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function checkDocker() {
  try {
    execSync('docker compose ps --format json', { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// --- Commands ---

async function stopAll() {
  log('Stopping all dev services...');

  const pids = loadPids();
  for (const { pid, name } of pids) {
    if (isProcessAlive(pid)) {
      killProcess(pid);
      ok(`Stopped ${name} (PID ${pid})`);
    }
  }

  if (existsSync(PID_FILE)) unlinkSync(PID_FILE);

  try {
    execSync('docker compose -f docker-compose.yml -f docker-compose.dev.yml down', {
      cwd: ROOT,
      stdio: 'inherit',
    });
    ok('Docker infrastructure stopped');
  } catch {
    warn('Docker compose down failed (may not be running)');
  }
}

async function showStatus() {
  console.log('');
  console.log(`${C.cyan}${'='.repeat(50)}${C.reset}`);
  console.log(`${C.cyan}  AIA Platform — Development Status${C.reset}`);
  console.log(`${C.cyan}${'='.repeat(50)}${C.reset}`);
  console.log('');

  // Docker
  console.log(`${C.blue}Docker Infrastructure:${C.reset}`);
  try {
    execSync('docker compose -f docker-compose.yml -f docker-compose.dev.yml ps', {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    warn('Docker not running or docker compose not available');
  }

  console.log('');
  console.log(`${C.blue}Application Processes:${C.reset}`);
  const pids = loadPids();
  if (pids.length === 0) {
    warn('No app processes tracked. Run: node scripts/dev.mjs');
  } else {
    for (const { pid, name, port } of pids) {
      const alive = isProcessAlive(pid);
      const icon = alive ? `${C.green}●${C.reset}` : `${C.red}●${C.reset}`;
      const status = alive ? `→ http://localhost:${port}` : '— DEAD';
      console.log(`  ${icon} ${name} (PID ${pid}) ${status}`);
    }
  }

  console.log('');
  console.log(`${C.blue}Health Checks:${C.reset}`);
  const checks = [
    ['PostgreSQL', null],
    ['Redis', null],
    ['LiteLLM', 'http://localhost:4000/health'],
    ['Neo4j', 'http://localhost:7474'],
    ['Gateway', 'http://localhost:3000/health'],
  ];

  for (const [name, url] of checks) {
    if (!url) {
      // Docker-only services — check via docker
      console.log(`  ${C.yellow}?${C.reset} ${name} (check via docker compose ps)`);
    } else {
      const healthy = await checkHealth(name, url);
      const icon = healthy ? `${C.green}●${C.reset}` : `${C.red}●${C.reset}`;
      console.log(`  ${icon} ${name}`);
    }
  }
  console.log('');
}

async function startAll(skipInfra = false) {
  // Pre-flight checks
  log('Running pre-flight checks...');

  try {
    execSync('docker --version', { stdio: 'pipe' });
  } catch {
    err('Docker not found. Install Docker Desktop.');
    process.exit(1);
  }

  const nodeVersion = parseInt(process.version.slice(1));
  if (nodeVersion < 20) {
    err(`Node.js 20+ required. Found: ${process.version}`);
    process.exit(1);
  }

  if (!existsSync(resolve(ROOT, '.env'))) {
    if (existsSync(resolve(ROOT, '.env.example'))) {
      warn('.env not found. Creating from .env.example...');
      const example = readFileSync(resolve(ROOT, '.env.example'), 'utf8');
      writeFileSync(resolve(ROOT, '.env'), example);
      warn('Created .env — edit it with your API keys, then run again.');
      process.exit(1);
    } else {
      err('No .env or .env.example found.');
      process.exit(1);
    }
  }

  ok('Pre-flight checks passed');

  // Step 1: Docker infrastructure
  if (!skipInfra) {
    console.log('');
    log('Starting Docker infrastructure...');
    try {
      execSync(
        'docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d',
        { cwd: ROOT, stdio: 'inherit' }
      );
      ok('Docker services started');
    } catch (e) {
      err('Failed to start Docker. Check docker compose logs.');
      process.exit(1);
    }

    log('Waiting for services to be healthy (30s max)...');
    const healthChecks = [
      ['LiteLLM', 'http://localhost:4000/health'],
    ];

    for (const [name, url] of healthChecks) {
      let healthy = false;
      for (let i = 0; i < 30; i++) {
        healthy = await checkHealth(name, url, 2000);
        if (healthy) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (healthy) {
        ok(`${name} is healthy`);
      } else {
        warn(`${name} not healthy after 30s — continuing anyway`);
      }
    }
  } else {
    log('Skipping Docker infrastructure (--skip-infra)');
  }

  // Step 2: Install dependencies
  console.log('');
  if (!existsSync(resolve(ROOT, 'node_modules'))) {
    log('Installing dependencies...');
    execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' });
    ok('Dependencies installed');
  } else {
    ok('Dependencies already installed');
  }

  // Step 3: Build shared packages
  console.log('');
  log('Building shared packages...');
  const packages = ['@aia/shared', '@aia/ai-client', '@aia/auth', '@aia/graph'];
  for (const pkg of packages) {
    try {
      execSync(`pnpm --filter ${pkg} build`, { cwd: ROOT, stdio: 'pipe' });
      ok(`${pkg} built`);
    } catch {
      warn(`${pkg} build failed (may not have build script)`);
    }
  }

  // Step 4: Start app processes
  console.log('');
  log('Starting application services...');
  const pids = [];

  // Gateway
  const gateway = spawn('npx', ['tsx', 'watch', 'src/index.ts'], {
    cwd: resolve(ROOT, 'apps/gateway'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    detached: false,
    env: { ...process.env, NODE_ENV: 'development' },
  });
  gateway.stdout.pipe(process.stdout);
  gateway.stderr.pipe(process.stderr);
  pids.push({ pid: gateway.pid, name: 'gateway', port: 3000 });
  ok(`Gateway started (PID ${gateway.pid}) → http://localhost:3000`);

  // Dashboard
  const dashboard = spawn('npx', ['vite', '--port', '5173'], {
    cwd: resolve(ROOT, 'apps/dashboard'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    detached: false,
  });
  dashboard.stdout.pipe(process.stdout);
  dashboard.stderr.pipe(process.stderr);
  pids.push({ pid: dashboard.pid, name: 'dashboard', port: 5173 });
  ok(`Dashboard started (PID ${dashboard.pid}) → http://localhost:5173`);

  // Client
  const client = spawn('npx', ['vite', '--port', '5174'], {
    cwd: resolve(ROOT, 'apps/client'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    detached: false,
  });
  client.stdout.pipe(process.stdout);
  client.stderr.pipe(process.stderr);
  pids.push({ pid: client.pid, name: 'client', port: 5174 });
  ok(`Client started (PID ${client.pid}) → http://localhost:5174`);

  savePids(pids);

  // Summary
  console.log('');
  console.log(`${C.cyan}${'='.repeat(50)}${C.reset}`);
  console.log(`${C.cyan}  AIA Platform — All services running${C.reset}`);
  console.log(`${C.cyan}${'='.repeat(50)}${C.reset}`);
  console.log('');
  console.log(`  ${C.green}Infrastructure:${C.reset}`);
  console.log('    PostgreSQL    → localhost:5432');
  console.log('    Redis         → localhost:6379');
  console.log('    LiteLLM       → localhost:4000');
  console.log('    Neo4j         → localhost:7474 (browser) / :7687 (bolt)');
  console.log('');
  console.log(`  ${C.green}Applications:${C.reset}`);
  console.log('    Gateway API   → http://localhost:3000');
  console.log('    Dashboard     → http://localhost:5173');
  console.log('    Client        → http://localhost:5174');
  console.log('');
  console.log(`  ${C.yellow}Commands:${C.reset}`);
  console.log('    node scripts/dev.mjs --status   Show status');
  console.log('    node scripts/dev.mjs --stop     Stop everything');
  console.log('');

  // Keep alive until Ctrl+C
  process.on('SIGINT', () => {
    console.log('');
    log('Shutting down...');
    for (const { pid, name } of pids) {
      killProcess(pid);
      ok(`Stopped ${name}`);
    }
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
    process.exit(0);
  });

  // Keep the process running
  await new Promise(() => {});
}

// --- Main ---

const args = process.argv.slice(2);

if (args.includes('--stop')) {
  await stopAll();
} else if (args.includes('--status')) {
  await showStatus();
} else {
  const skipInfra = args.includes('--skip-infra');
  await startAll(skipInfra);
}

import { describe, it, expect } from 'vitest';
import { isNewerVersion, getAppVersion } from './version.js';
import {
  getDataDir,
  getInstallDir,
  getInstalledBinaryPath,
  getExeName,
} from './paths.js';
import { isInstalledBinary } from './installer.js';

describe('version', () => {
  it('getAppVersion returns semver string', () => {
    expect(getAppVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('isNewerVersion compares semver triples', () => {
    expect(isNewerVersion('0.4.0', '0.3.0')).toBe(true);
    expect(isNewerVersion('0.3.0', '0.3.0')).toBe(false);
    expect(isNewerVersion('0.3.1', '0.3.10')).toBe(false);
    expect(isNewerVersion('1.0.0', '0.9.9')).toBe(true);
  });
});

describe('paths', () => {
  it('resolves install paths under home', () => {
    expect(getDataDir()).toContain('.108ai');
    expect(getInstallDir()).toContain('bin');
    expect(getInstalledBinaryPath()).toContain(getExeName());
  });
});

describe('installer', () => {
  it('detects installed binary location', () => {
    const installPath = getInstalledBinaryPath();
    expect(isInstalledBinary(installPath)).toBe(true);
    expect(isInstalledBinary('/tmp/108ai.exe')).toBe(false);
  });
});

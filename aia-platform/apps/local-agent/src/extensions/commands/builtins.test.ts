import { describe, expect, it } from 'vitest';

import {
  isBuiltinCommandId,
  resolveBuiltinHandler,
  registerBuiltinCommandFallbacks,
} from './builtins.js';
import { loadCommandsFromDisk } from '../loader.js';
import { resolveCommand } from '../registry.js';

describe('builtin commands', () => {
  it('resolves known builtin handlers', () => {
    expect(isBuiltinCommandId('triage')).toBe(true);
    expect(isBuiltinCommandId('job')).toBe(true);
    expect(isBuiltinCommandId('unknown')).toBe(false);
    expect(resolveBuiltinHandler('triage')).toBeTypeOf('function');
    expect(resolveBuiltinHandler('nope')).toBeUndefined();
  });

  it('registers triage and job commands from seed YAML', () => {
    const result = loadCommandsFromDisk();
    expect(result.loaded).toBeGreaterThanOrEqual(6);

    const triage = resolveCommand('triage');
    expect(triage).toBeDefined();
    expect(triage?.handler).toBeTypeOf('function');
    expect(triage?.definition.builtin).toBe('triage');

    const job = resolveCommand('jobs');
    expect(job?.definition.name).toBe('job');
    expect(job?.handler).toBeTypeOf('function');
  });

  it('fallback registers builtins when YAML missing', () => {
    registerBuiltinCommandFallbacks();
    expect(resolveCommand('standup')?.handler).toBeTypeOf('function');
    expect(resolveCommand('schedule')?.handler).toBeTypeOf('function');
  });
});

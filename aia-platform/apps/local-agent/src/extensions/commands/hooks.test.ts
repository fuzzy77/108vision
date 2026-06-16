import { describe, expect, it } from 'vitest';

import { registerCommand } from '../registry.js';
import { executeRegisteredCommand } from './executor.js';
import type { ExtensionShellContext, RegisteredCommand } from '../types.js';

const shellCtx: ExtensionShellContext = {
  gatewayHttp: 'http://localhost',
  authToken: 't',
  tenantId: 'tenant',
  config: {} as ExtensionShellContext['config'],
};

describe('command hooks', () => {
  it('runs before hook command before main handler', async () => {
    const order: string[] = [];

    registerCommand({
      origin: 'builtin',
      definition: { name: 'hook-before-test', description: 'before' },
      handler: async () => {
        order.push('before');
        return 'before-ok';
      },
    });

    const mainCmd: RegisteredCommand = {
      origin: 'builtin',
      definition: {
        name: 'main-hook-test',
        description: 'main',
        hooks: { before: 'hook-before-test' },
      },
      handler: async () => {
        order.push('main');
        return 'main-ok';
      },
    };

    const result = await executeRegisteredCommand(mainCmd, [], shellCtx);
    expect(result.output).toBe('main-ok');
    expect(order).toEqual(['before', 'main']);
  });
});

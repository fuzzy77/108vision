import { describe, expect, it } from 'vitest';

import { renderTemplate, resolveTemplateValue } from './template.js';

describe('renderTemplate', () => {
  it('substitutes params and context', () => {
    const result = renderTemplate('Hello {{params.name}} — {{context.total}} items', {
      params: { name: 'Mario' },
      context: { total: 3 },
    });
    expect(result).toBe('Hello Mario — 3 items');
  });

  it('renders each blocks over context arrays', () => {
    const result = renderTemplate(
      '{{#each context.emails}}{{subject}}; {{/each}}',
      {
        params: {},
        context: {
          emails: [{ subject: 'A' }, { subject: 'B' }],
        },
      },
    );
    expect(result).toBe('A;\nB;');
  });
});

describe('resolveTemplateValue', () => {
  it('resolves param references to numbers', () => {
    const value = resolveTemplateValue('{{params.count}}', { count: 5 });
    expect(value).toBe(5);
  });
});

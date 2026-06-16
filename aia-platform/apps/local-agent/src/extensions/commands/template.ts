/**
 * Minimal template engine for command prompts.
 * Supports {{params.x}}, {{context.key}}, and {{#each context.items}}...{{/each}}.
 */

export interface TemplateContext {
  params: Record<string, string | number | boolean>;
  context: Record<string, unknown>;
}

const PARAM_PATTERN = /\{\{params\.([a-zA-Z0-9_]+)\}\}/g;
const CONTEXT_PATTERN = /\{\{context\.([a-zA-Z0-9_]+)\}\}/g;
const EACH_BLOCK_PATTERN = /\{\{#each\s+context\.([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

function stringifyValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}

function renderEachBlock(
  items: unknown,
  innerTemplate: string,
  base: TemplateContext,
): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  return items
    .map((item) => {
      const loopContext: TemplateContext = {
        params: base.params,
        context: {
          ...base.context,
          ...(typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : { value: item }),
        },
      };
      return renderTemplate(innerTemplate, loopContext);
    })
    .join('\n');
}

/** Render a command prompt template with params and fetched context */
export function renderTemplate(template: string, data: TemplateContext): string {
  let result = template.replace(EACH_BLOCK_PATTERN, (_match, key: string, inner: string) => {
    const items = data.context[key];
    return renderEachBlock(items, inner, data);
  });

  result = result.replace(PARAM_PATTERN, (_match, key: string) => {
    const value = data.params[key];
    return value === undefined ? '' : stringifyValue(value);
  });

  result = result.replace(CONTEXT_PATTERN, (_match, key: string) => {
    return stringifyValue(data.context[key]);
  });

  // Flat aliases used inside #each blocks: {{from}}, {{subject}}, etc.
  result = result.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key: string) => {
    if (key === 'params' || key === 'context' || key.startsWith('#') || key.startsWith('/')) {
      return match;
    }
    const fromContext = data.context[key];
    if (fromContext !== undefined) {
      return stringifyValue(fromContext);
    }
    const fromParams = data.params[key];
    if (fromParams !== undefined) {
      return stringifyValue(fromParams);
    }
    return match;
  });

  return result.trim();
}

/** Resolve a template string that may reference params (e.g. "{{params.count}}") */
export function resolveTemplateValue(
  value: string | number | undefined,
  params: Record<string, string | number | boolean>,
): string | number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;

  const rendered = renderTemplate(String(value), { params, context: {} });
  const asNumber = Number(rendered);
  if (rendered !== '' && !Number.isNaN(asNumber) && /^-?\d+(\.\d+)?$/.test(rendered.trim())) {
    return asNumber;
  }
  return rendered;
}

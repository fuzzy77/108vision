import { describe, it, expect } from 'vitest';
import { fuzzyReplace, FuzzyEditError } from './fuzzy-edit.js';

describe('fuzzyReplace', () => {
  const sampleCode = `function hello() {
  const name = "world";
  console.log(\`Hello \${name}\`);
  return name;
}`;

  describe('Strategy 1: Exact match', () => {
    it('replaces exact string', () => {
      const result = fuzzyReplace(sampleCode, 'const name = "world"', 'const name = "earth"');
      expect(result.strategy).toBe('simpleReplacer');
      expect(result.content).toContain('const name = "earth"');
    });
  });

  describe('Strategy 2: Line-trimmed', () => {
    it('matches despite trailing whitespace', () => {
      const content = 'function foo() {\n  return 42;   \n}\n';
      const result = fuzzyReplace(content, '  return 42;\n', '  return 99;\n');
      expect(result.content).toContain('return 99;');
      expect(result.content).not.toContain('return 42;');
    });

    it('matches single line with different indent', () => {
      const content = '    const x = 1;\n';
      const result = fuzzyReplace(content, 'const x = 1;', 'const x = 2;');
      expect(result.content).toContain('const x = 2;');
    });

    it('uses lineTrimmedReplacer when only trailing ws differs across multi-line', () => {
      const content = 'a\n  foo  \n  bar  \nb';
      const result = fuzzyReplace(content, '  foo\n  bar', 'replaced');
      expect(result.strategy).toBe('lineTrimmedReplacer');
      expect(result.content).toContain('replaced');
    });
  });

  describe('Strategy 4: Whitespace normalized', () => {
    it('handles collapsed whitespace', () => {
      const content = 'const   result  =   await   fetch(url);';
      const result = fuzzyReplace(content, 'const result = await fetch(url);', 'const result = await get(url);');
      expect(result.strategy).toBe('whitespaceNormalizedReplacer');
      expect(result.content).toBe('const result = await get(url);');
    });
  });

  describe('Strategy 5: Indentation flexible', () => {
    it('matches code re-indented by 2 spaces', () => {
      const content = `class Foo {
    bar() {
      return 1;
    }
}`;
      const find = `  bar() {
    return 1;
  }`;
      const replace = `  bar() {
    return 2;
  }`;
      const result = fuzzyReplace(content, find, replace);
      // Block anchor or indentation flexible — both valid cascade results
      expect(result.content).toContain('return 2;');
    });

    it('resolves indentation differences regardless of which strategy matches first', () => {
      const content = `    const a = 1;\n    const b = 2;`;
      const find = `  const a = 1;\n  const b = 2;`;
      const result = fuzzyReplace(content, find, 'const a = 10;\nconst b = 20;');
      // Multiple strategies can handle this — what matters is the result
      expect(result.content).toBe('const a = 10;\nconst b = 20;');
    });
  });

  describe('Strategy 6: Escape normalized', () => {
    it('handles escaped newlines in search', () => {
      const content = 'line1\nline2\nline3';
      const result = fuzzyReplace(content, 'line1\\nline2', 'lineA\nlineB');
      expect(result.strategy).toBe('escapeNormalizedReplacer');
      expect(result.content).toBe('lineA\nlineB\nline3');
    });
  });

  describe('Strategy 7: Trimmed boundary', () => {
    it('matches when search has leading/trailing whitespace', () => {
      const content = 'hello world\n';
      const result = fuzzyReplace(content, '  hello world  ', 'goodbye world');
      // lineTrimmed or trimmedBoundary — both handle this case
      expect(result.content).toContain('goodbye world');
    });

    it('uses trimmedBoundary on multi-line with boundary whitespace', () => {
      const content = 'prefix\nthe target block\nsuffix';
      const find = '\n\nthe target block\n\n';
      const result = fuzzyReplace(content, find, 'replaced');
      expect(result.strategy).toBe('trimmedBoundaryReplacer');
      expect(result.content).toContain('replaced');
    });
  });

  describe('Strategy 3: Block anchor', () => {
    it('matches block with slightly different middle', () => {
      const content = `function process() {
  const start = Date.now();
  const data = fetchRemote();
  const transformed = transform(data);
  const end = Date.now();
  return { data: transformed, duration: end - start };
}`;
      const find = `function process() {
  const start = Date.now();
  const data = fetchData();
  const transformed = transform(data);
  const end = Date.now()
  return { data: transformed, duration: end - start };
}`;
      const replace = `function process() {
  const t0 = performance.now();
  const data = fetchRemote();
  const transformed = transform(data);
  const t1 = performance.now();
  return { data: transformed, duration: t1 - t0 };
}`;
      const result = fuzzyReplace(content, find, replace);
      expect(['blockAnchorReplacer', 'contextAwareReplacer']).toContain(result.strategy);
      expect(result.content).toContain('performance.now()');
    });
  });

  describe('replaceAll option', () => {
    it('replaces all occurrences', () => {
      const content = 'foo bar foo baz foo';
      const result = fuzzyReplace(content, 'foo', 'qux', { replaceAll: true });
      expect(result.content).toBe('qux bar qux baz qux');
    });
  });

  describe('error cases', () => {
    it('throws NOT_FOUND when nothing matches', () => {
      expect(() => fuzzyReplace('hello world', 'nonexistent string here', 'x')).toThrow(
        FuzzyEditError,
      );
      try {
        fuzzyReplace('hello world', 'nonexistent string here', 'x');
      } catch (e) {
        expect((e as FuzzyEditError).code).toBe('NOT_FOUND');
      }
    });

    it('throws MULTIPLE_MATCHES when ambiguous', () => {
      const content = 'const x = 1;\nconst y = 2;\nconst x = 1;';
      expect(() => fuzzyReplace(content, 'const x = 1;', 'const x = 99;')).toThrow(FuzzyEditError);
      try {
        fuzzyReplace(content, 'const x = 1;', 'const x = 99;');
      } catch (e) {
        expect((e as FuzzyEditError).code).toBe('MULTIPLE_MATCHES');
      }
    });
  });
});

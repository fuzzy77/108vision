/**
 * LSP Server Registry — Known language servers and their spawn configurations.
 *
 * Each entry describes how to spawn and detect a language server for a given language.
 * Auto-detection works by checking rootUri for project markers (package.json, Cargo.toml, etc.)
 */

export interface LspServerConfig {
  id: string;
  name: string;
  languages: string[];
  command: string[];
  rootMarkers: string[];
  installHint: string;
}

export const LSP_SERVERS: LspServerConfig[] = [
  {
    id: 'typescript',
    name: 'TypeScript Language Server',
    languages: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    command: ['typescript-language-server', '--stdio'],
    rootMarkers: ['package.json', 'tsconfig.json', 'jsconfig.json'],
    installHint: 'npm install -g typescript-language-server typescript',
  },
  {
    id: 'pyright',
    name: 'Pyright',
    languages: ['python'],
    command: ['pyright-langserver', '--stdio'],
    rootMarkers: ['pyproject.toml', 'setup.py', 'requirements.txt', 'Pipfile'],
    installHint: 'npm install -g pyright',
  },
  {
    id: 'rust-analyzer',
    name: 'Rust Analyzer',
    languages: ['rust'],
    command: ['rust-analyzer'],
    rootMarkers: ['Cargo.toml'],
    installHint: 'rustup component add rust-analyzer',
  },
  {
    id: 'gopls',
    name: 'gopls',
    languages: ['go'],
    command: ['gopls'],
    rootMarkers: ['go.mod'],
    installHint: 'go install golang.org/x/tools/gopls@latest',
  },
  {
    id: 'csharp-ls',
    name: 'C# Language Server',
    languages: ['csharp'],
    command: ['csharp-ls'],
    rootMarkers: ['*.sln', '*.csproj'],
    installHint: 'dotnet tool install -g csharp-ls',
  },
  {
    id: 'json',
    name: 'JSON Language Server',
    languages: ['json', 'jsonc'],
    command: ['vscode-json-language-server', '--stdio'],
    rootMarkers: [],
    installHint: 'npm install -g vscode-langservers-extracted',
  },
  {
    id: 'html',
    name: 'HTML Language Server',
    languages: ['html'],
    command: ['vscode-html-language-server', '--stdio'],
    rootMarkers: [],
    installHint: 'npm install -g vscode-langservers-extracted',
  },
  {
    id: 'css',
    name: 'CSS Language Server',
    languages: ['css', 'scss', 'less'],
    command: ['vscode-css-language-server', '--stdio'],
    rootMarkers: [],
    installHint: 'npm install -g vscode-langservers-extracted',
  },
];

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.js': 'javascript',
  '.jsx': 'javascriptreact',
  '.mts': 'typescript',
  '.mjs': 'javascript',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.cs': 'csharp',
  '.json': 'json',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
};

export function getLanguageId(filePath: string): string | null {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  return EXTENSION_LANGUAGE_MAP[ext] ?? null;
}

export function findServerForLanguage(languageId: string): LspServerConfig | null {
  return LSP_SERVERS.find((s) => s.languages.includes(languageId)) ?? null;
}

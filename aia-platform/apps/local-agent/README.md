# 108 AI — Desktop Agent

On-premise desktop agent that runs on the client's machine and provides OS-level capabilities (file system, shell, code editing, git, clipboard, desktop automation) to AI agents running on the 108 AI platform.

## How It Works

The desktop agent connects to the 108 AI Gateway via WebSocket and waits for action requests from AI assistants. When an action is requested, it executes it locally (within configured security boundaries) and returns the result.

```
AI Assistant  -->  108 AI Gateway  -->  WebSocket  -->  Desktop Agent  -->  OS
                                                                            |
                                                            File System / Shell / Git / Desktop
```

## Installation

### Prerequisites

- Node.js 20+
- npm 10+

### From Source

```bash
cd apps/local-agent
npm install
npm run build
```

### Docker (alternative)

```bash
docker build -t 108ai-desktop .
docker run -d \
  --name 108ai \
  -e GATEWAY_URL=wss://api.108ai.dev \
  -e TENANT_ID=your-tenant-uuid \
  -e AUTH_TOKEN=your-auth-token \
  -v /path/to/data:/data \
  108ai-desktop
```

## Configuration

On first run, an interactive setup wizard will guide you. Configuration is stored at:

```
~/.108ai/config.json
```

### Config Options

| Option | Description | Default |
|--------|-------------|---------|
| `gatewayUrl` | Gateway WebSocket URL | (required) |
| `authToken` | Authentication token | (required) |
| `tenantId` | Tenant UUID | (required) |
| `allowedDirectories` | Directories the agent can access | Documents, Desktop, Downloads |
| `autoStart` | Start on system boot | false |
| `maxActionsPerMinute` | Rate limit | 10 |
| `desktopEnabled` | Enable desktop automation | false |

### CLI Arguments

```bash
108ai --gateway-url wss://api.108ai.dev --tenant-id <UUID> --token <token>
```

CLI arguments override config file values.

## Capabilities

### Filesystem

| Action | Description | Risk |
|--------|-------------|------|
| `filesystem.readFile` | Read a text file (max 10MB) | read_only |
| `filesystem.writeFile` | Write content to a file | low_risk |
| `filesystem.listDirectory` | List files in a directory | read_only |
| `filesystem.searchFiles` | Search files by glob pattern | read_only |
| `filesystem.watchDirectory` | Watch for file changes | read_only |
| `filesystem.getFileInfo` | Get file metadata | read_only |

### Shell (planned v0.2)

| Action | Description | Risk |
|--------|-------------|------|
| `shell.execute` | Execute command, return stdout/stderr/exit | high_risk |
| `shell.executeStream` | Long-running command with streaming output | high_risk |
| `shell.terminate` | Kill a running process | low_risk |
| `shell.getRunning` | List active agent-spawned processes | read_only |

### Code (planned v0.2)

| Action | Description | Risk |
|--------|-------------|------|
| `code.edit` | Diff-based edit (old_string -> new_string) | low_risk |
| `code.editMulti` | Multiple atomic edits in one file | low_risk |
| `code.write` | Write entire file (new files or full rewrite) | low_risk |
| `code.readRange` | Read line range with line numbers | read_only |

### Git (planned v0.2)

| Action | Description | Risk |
|--------|-------------|------|
| `git.status` | Working tree status | read_only |
| `git.diff` | Staged + unstaged diff | read_only |
| `git.log` | Recent commits | read_only |
| `git.commit` | Stage + commit | low_risk |
| `git.branch` | Create/switch/list branches | low_risk |
| `git.stash` | Stash/pop changes | low_risk |
| `git.blame` | Line-level blame | read_only |

### Search (planned v0.3)

| Action | Description | Risk |
|--------|-------------|------|
| `search.grep` | Regex search with context (ripgrep-like) | read_only |
| `search.glob` | File pattern matching | read_only |
| `search.semantic` | Embedding-based local search | read_only |

### Web (planned v0.3)

| Action | Description | Risk |
|--------|-------------|------|
| `web.fetch` | GET URL, return content | low_risk |
| `web.search` | Web search via API | read_only |

### MCP (planned v0.4)

| Action | Description | Risk |
|--------|-------------|------|
| `mcp.listServers` | List configured MCP servers | read_only |
| `mcp.listTools` | List tools from a server | read_only |
| `mcp.callTool` | Invoke a tool on MCP server | high_risk |

### Clipboard

| Action | Description | Risk |
|--------|-------------|------|
| `clipboard.read` | Read clipboard content | read_only |
| `clipboard.write` | Write to clipboard | low_risk |

### System

| Action | Description | Risk |
|--------|-------------|------|
| `system.openUrl` | Open URL in default browser | low_risk |
| `system.openFile` | Open file with default app | low_risk |
| `system.showNotification` | Show OS notification | read_only |
| `system.getSystemInfo` | Get OS/memory/disk info | read_only |

### Desktop (opt-in)

| Action | Description | Risk |
|--------|-------------|------|
| `desktop.listWindows` | List visible windows | read_only |
| `desktop.readWindow` | Read window text via accessibility | read_only |
| `desktop.readFocused` | Read focused window content | read_only |
| `desktop.screenshot` | Capture window/screen screenshot | read_only |
| `desktop.analyzeScreen` | Screenshot + LLM vision analysis | read_only |
| `desktop.getUITree` | Get accessibility UI tree | read_only |
| `desktop.focusWindow` | Bring window to foreground | low_risk |
| `desktop.scrollWindow` | Scroll within a window | low_risk |
| `desktop.typeText` | Type text into focused input | high_risk |
| `desktop.clickElement` | Click UI element by name | high_risk |
| `desktop.pressHotkey` | Press keyboard hotkey | high_risk |
| `desktop.mouseClick` | Click at screen coordinates | high_risk |

## Security

### Sandboxing

- File operations are restricted to explicitly configured `allowedDirectories`
- Path traversal (`../`) is prevented by resolving to absolute paths
- System directories (Windows, Program Files, /usr, /etc) are always blocked
- Binary files cannot be read
- Shell commands require explicit approval from the gateway

### Risk Levels

| Level | Behavior |
|-------|----------|
| `read-only` | Auto-approved (no state change) |
| `low-risk` | Auto-approved (minor, reversible state change) |
| `high-risk` | Requires gateway approval flag (`_approved: true`) |

### Rate Limiting

- Maximum 10 actions per minute (configurable)
- Prevents runaway AI agents from overwhelming the system

### Audit Log

All actions are logged to `~/.108ai/audit.log` in JSONL format:

```json
{"timestamp":"2026-06-09T10:30:00.000Z","action":"filesystem.readFile","params":{"path":"/home/user/doc.txt"},"result":"allowed","durationMs":5}
```

### Authentication

- WebSocket connection requires a valid auth token
- Token is validated by the gateway on connection
- Heartbeat every 30s to detect disconnection

## Auto-Start

To add the agent to system startup:

```bash
# The installer module handles platform-specific registration:
# - Windows: Registry Run key
# - macOS: LaunchAgent (dev.108ai.desktop)
# - Linux: systemd user service (108ai-desktop.service)
```

## Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Build
npm run build

# Run built version
npm start
```

### Interactive shell & extensions

The REPL shell (`pnpm dev`) supports custom commands, skills, persona agents, and MCP servers under `~/.108ai/`.

| Feature | CLI |
|---------|-----|
| Terminal dashboard | `/ui dashboard` |
| Command palette | `/palette [query]` |
| Web dashboard | `/ui web` → `http://127.0.0.1:7891` |
| Persona agents | `/agent use <name>` |
| Daily triage | `/triage`, `/morning` |

See [docs/USER-GUIDE.md](./docs/USER-GUIDE.md) and [docs/SECURITY-RUNBOOK.md](./docs/SECURITY-RUNBOOK.md).

## AI Model Routing

The 108 AI platform routes requests through LiteLLM with the following tiers:

| Tier | Primary | Fallback | Use Case |
|------|---------|----------|----------|
| `fast-cheap` | DeepSeek V3 | Qwen3-8B | Chat, simple tasks, high volume |
| `balanced` | DeepSeek R1 | Qwen3-32B | Complex reasoning, multi-step |
| `powerful` | Qwen3-235B | DeepSeek R1 | Architecture, critical analysis |
| `coding` | DeepSeek V3 | Qwen3-30B | Code generation, review |
| `vision` | Qwen-VL-Max | DeepSeek V3 | Screenshot analysis, OCR |
| `embedding` | Alibaba text-embedding-v3 | OpenAI ada-3-small | RAG, semantic search |

All model calls are tracked for per-tenant billing.

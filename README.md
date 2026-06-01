# codemax

A powerful CLI AI coding tool with multi-provider support, MCP integration, skills system, and 25+ built-in slash commands — inspired by Claude Code.

## Features

- **Multi-provider**: OpenAI, Anthropic, Google, OpenRouter, Ollama, Azure
- **Interactive REPL** with streaming output and tool-calling loop
- **25+ slash commands**: `/help`, `/plan`, `/review`, `/batch`, `/model`, `/diff`, `/permissions`, more
- **6 built-in tools**: `read`, `write`, `edit`, `bash`, `glob`, `grep`
- **MCP integration**: Connect any MCP server and use its tools natively
- **Skills system**: Load custom markdown-based skill templates
- **Hooks engine**: Pre/post tool hooks with shell scripts
- **Permission system**: Allow/ask/deny tool execution rules
- **Session management**: Context tracking, token estimation, compaction

## Installation

```bash
npm install -g codemax
```

## Quick Start

```bash
# Start interactive session
codemax

# One-shot prompt
codemax "Explain how this code works"

# Show configuration
codemax config show

# Initialize config
codemax config init
```

## Configuration

codemax looks for config in this order:

1. Environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, etc.)
2. `codemax.json` in the current or parent directory
3. `.codemaxrc`, `.codemaxrc.json`
4. Default values

### Config file example

```json
{
  "model": "openai/gpt-4o",
  "providers": {
    "openai": { "apiKey": "sk-..." },
    "anthropic": { "apiKey": "sk-ant-..." },
    "google": { "apiKey": "AIza..." },
    "ollama": { "baseUrl": "http://localhost:11434" }
  },
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"]
    }
  },
  "permissions": {
    "default": "ask"
  }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help message |
| `/clear` | Clear conversation context |
| `/exit` | Exit the CLI |
| `/model` | Switch AI model |
| `/config` | Open configuration settings |
| `/status` | Show version, model, and session info |
| `/plan` | Enter plan mode |
| `/cost` | Show token usage and cost |
| `/permissions` | Manage tool permissions |
| `/doctor` | Diagnose installation and configuration |
| `/compact` | Compact conversation context |
| `/diff` | Show current uncommitted changes |
| `/review` | Review current diff for issues |
| `/init` | Initialize project with CODEMAX.md |
| `/export` | Export conversation |
| `/mcp` | Manage MCP server connections |
| `/skill` | Manage skills |
| `/hooks` | View hook configurations |
| `/agent` | Manage subagent configurations |
| `/batch` | Batch process large changes |
| `/background` | Run a prompt in background |
| `/btw` | Ask a side question |
| `/rewind` | Rewind to checkpoint |
| `/upgrade` | Check for updates |
| `/feedback` | Submit feedback |

## Tools

codemax's AI model can use these built-in tools autonomously:

- **read** — Read file contents with offset/limit
- **write** — Write content to files (auto-creates directories)
- **edit** — Exact string replacement (supports replaceAll)
- **bash** — Execute shell commands
- **glob** — Find files matching glob patterns
- **grep** — Search file contents with regex

## Development

```bash
git clone https://github.com/wzx14715596144/codemax
cd codemax
npm install
npm run build
npm test
```

## License

MIT

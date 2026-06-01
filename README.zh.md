# codemax

> 一个强大的终端 AI 编程助手。支持多模型供应商、MCP、技能系统和内置命令。

```bash
npm install -g codemax
codemax
```

## 特性

- **多模型供应商** — OpenAI、Anthropic Claude、Google Gemini、OpenRouter、Ollama、Azure OpenAI
- **交互式对话** — 在终端中直接流式输出 AI 回复
- **斜杠命令** — 20+ 内置命令 (/help、/plan、/review、/diff、/mcp 等)
- **工具系统** — AI 可以读写文件、执行命令、搜索代码
- **MCP 集成** — 连接任何 MCP 服务器扩展能力
- **技能系统** — 用 Markdown 模板创建自定义技能
- **钩子系统** — 在工具执行前后运行脚本
- **会话管理** — 持久化、导出、压缩上下文
- **配置系统** — 分层配置（全局 → 项目 → 环境变量）

## 快速开始

```bash
# 安装
npm install -g codemax

# 启动交互式会话
codemax

# 单次运行
codemax "解释这个项目的架构"

# 初始化配置
codemax config init
```

## 配置

通过环境变量或 `codemax.json` 设置 API 密钥：

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=AIza...
```

在项目根目录创建 `codemax.json`：

```json
{
  "model": "openai/gpt-4o",
  "providers": {
    "openai": { "apiKey": "sk-..." }
  },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

## 许可证

MIT

import { MCPClient } from './client';
import type { Config, MCPServerConfig } from '../config';
import { toolRegistry, type Tool } from '../tools';
import { logger } from '../utils';

export class MCPManager {
  private servers: Map<string, MCPClient> = new Map();
  private serverTools: Map<string, string[]> = new Map();
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async initializeAll(): Promise<void> {
    const servers = this.config.mcpServers || {};
    const names = Object.keys(servers);

    if (names.length === 0) return;

    logger.info(`Initializing ${names.length} MCP server(s)...`);

    for (const name of names) {
      const cfg = servers[name] as MCPServerConfig;
      await this.addServer(name, cfg);
    }
  }

  async addServer(name: string, config: MCPServerConfig): Promise<void> {
    try {
      const client = new MCPClient(config);
      await client.connect();
      const tools = await client.listTools();

      this.servers.set(name, client);
      const toolNames: string[] = [];

      const mgr = this;
      for (const t of tools) {
        const toolName = `${name}_${t.name}`;
        toolNames.push(toolName);

        const wrappedTool: Tool = {
          definition: {
            name: toolName,
            description: `[MCP:${name}] ${t.description}`,
            inputSchema: t.inputSchema,
          },
          async execute(args) {
            const c = mgr.servers.get(name);
            if (!c || !c.isConnected()) {
              return { success: false, output: '', error: `MCP server "${name}" is not connected` };
            }
            return c.callTool(t.name, args);
          },
        };
        toolRegistry.register(wrappedTool);
      }

      this.serverTools.set(name, toolNames);
      logger.success(`MCP server "${name}" connected (${tools.length} tools)`);
    } catch (err) {
      logger.error(`Failed to connect MCP server "${name}":`, err instanceof Error ? err.message : String(err));
    }
  }

  async removeServer(name: string): Promise<void> {
    const client = this.servers.get(name);
    if (client) {
      await client.disconnect();
      this.servers.delete(name);
    }

    const toolNames = this.serverTools.get(name);
    if (toolNames) {
      for (const toolName of toolNames) {
        toolRegistry.unregister(toolName);
      }
      this.serverTools.delete(name);
    }

    logger.success(`MCP server "${name}" disconnected`);
  }

  listServers(): string[] {
    return Array.from(this.servers.keys());
  }

  getServer(name: string): MCPClient | undefined {
    return this.servers.get(name);
  }

  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.servers) {
      await client.disconnect();
      logger.dim(`Disconnected MCP server: ${name}`);
    }
    this.servers.clear();
    this.serverTools.clear();
  }
}

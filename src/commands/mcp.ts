import type { Command } from './registry';
import { logger } from '../utils';

export const mcpCommand: Command = {
  name: 'mcp',
  description: 'Manage MCP server connections',
  async execute(_ctx) {
    const { default: inquirer } = await import('inquirer');
    const mcpManager = _ctx.mcpManager;

    if (!mcpManager) {
      logger.error('MCP manager not available');
      return;
    }

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'MCP Server Management:',
      choices: [
        { name: 'List connected servers', value: 'list' },
        { name: 'Add new server', value: 'add' },
        { name: 'Remove server', value: 'remove' },
      ],
    }]);

    switch (action) {
      case 'list': {
        const servers = mcpManager.listServers();
        if (servers.length === 0) {
          logger.info('No MCP servers connected');
          return;
        }
        for (const s of servers) {
          const server = mcpManager.getServer(s);
          const tools = server?.getTools() || [];
          logger.info(`  ${s}: ${tools.length} tool(s)`);
        }
        break;
      }

      case 'add': {
        const { name, command, args } = await inquirer.prompt([
          { type: 'input', name: 'name', message: 'Server name:' },
          { type: 'input', name: 'command', message: 'Command (e.g., npx):' },
          { type: 'input', name: 'args', message: 'Arguments (space separated):' },
        ]);
        const serverConfig = { command, args: args ? args.split(' ').filter(Boolean) : [], env: {} as Record<string, string>, type: 'stdio' as const };
        await mcpManager.addServer(name, serverConfig);
        break;
      }

      case 'remove': {
        const servers = mcpManager.listServers();
        if (servers.length === 0) {
          logger.info('No MCP servers to remove');
          return;
        }
        const { name } = await inquirer.prompt([{
          type: 'list',
          name: 'name',
          message: 'Select server to remove:',
          choices: servers,
        }]);
        await mcpManager.removeServer(name);
        break;
      }
    }
  },
};

import * as readline from 'readline';
import type { Config } from '../config';
import type { Message } from '../provider/interface';
import type { ToolResult } from '../tools/types';
import { logger, getModelId } from '../utils';
import { CommandRegistry } from '../commands/registry';
import { SessionManager } from '../session/manager';
import { SessionStore } from '../session/store';
import { loadBuiltInCommands } from '../commands/loader';
import { AIProviderManager } from '../provider/manager';
import { registerBuiltInTools, toolRegistry } from '../tools';
import { MCPManager } from '../mcp/manager';
import { HookEngine } from '../hooks/engine';

function isToolAllowed(toolName: string, config: Config): 'allow' | 'deny' | 'ask' {
  const perms = config.permissions || { default: 'ask', allow: [], deny: [] };

  for (const rule of perms.deny || []) {
    if (rule.pattern) {
      try { if (new RegExp(rule.pattern).test(toolName)) return 'deny'; } catch { /* skip */ }
    }
    if (rule.tool === toolName) return 'deny';
  }

  for (const rule of perms.allow || []) {
    if (rule.pattern) {
      try { if (new RegExp(rule.pattern).test(toolName)) return 'allow'; } catch { /* skip */ }
    }
    if (rule.tool === toolName) return 'allow';
  }

  return perms.default || 'ask';
}

function showWelcome(config: Config) {
  logger.info('');
  logger.info('  ╔══════════════════════════════════════╗');
  logger.info('  ║          CODEMAX v0.1.0              ║');
  logger.info('  ║   AI Coding Assistant for Terminal   ║');
  logger.info('  ╚══════════════════════════════════════╝');
  logger.info('');
  logger.dim(`  Model: ${config.model || 'Not set'}`);
  logger.dim('  Type /help for commands, /exit to quit');
  logger.info('');
}

export async function chatAction(config: Config) {
  const session = new SessionManager();
  session.start();

  const sessionStore = new SessionStore();
  const hookEngine = new HookEngine(config);

  const providerManager = new AIProviderManager(config);
  providerManager.initializeProviders();

  registerBuiltInTools();

  const mcpManager = new MCPManager(config);
  await mcpManager.initializeAll();

  const cmdRegistry = new CommandRegistry();
  loadBuiltInCommands(cmdRegistry);

  showWelcome(config);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '',
  });

  const ask = (): Promise<string> => {
    return new Promise((resolve) => {
      rl.question('│ ', (answer) => {
        resolve(answer.trim());
      });
    });
  };

  while (true) {
    const input = await ask();
    if (!input) continue;

    if (input.trim().startsWith('/')) {
      const cmd = cmdRegistry.find(input);
      if (cmd) {
        await cmd.execute({ input, config, session, rl, providerManager, mcpManager });
        continue;
      }
      logger.error(`Unknown command. Type /help for available commands.`);
      continue;
    }

    const provider = providerManager.getCurrentProvider();
    if (!provider) {
      logger.error('No AI provider configured.');
      logger.dim('Run: codemax config set providers.openai.apiKey <your-key>');
      logger.dim('Or set OPENAI_API_KEY / ANTHROPIC_API_KEY / GOOGLE_API_KEY env vars');
      continue;
    }

    session.addMessage({ role: 'user', content: input });

    const conversationMessages = [...session.getMessages()];

    try {
      const modelId = getModelId(config.model);
      const toolsDefs = toolRegistry.getAllDefinitions();

      let turnCount = 0;
      const maxTurns = 10;

      while (turnCount < maxTurns) {
        turnCount++;
        let responseText = '';

        const stream = provider.chat(conversationMessages, {
          model: modelId,
          tools: toolsDefs.length > 0 ? toolsDefs : undefined,
          stream: true,
          onToken: (token: string) => {
            process.stdout.write(token);
            responseText += token;
          },
        });

        const toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> = [];

        for await (const chunk of stream) {
          if (chunk.type === 'tool_use' && chunk.toolCall) {
            const tc = chunk.toolCall;
            let parsedArgs: Record<string, unknown>;
            try {
              parsedArgs = JSON.parse(tc.function.arguments || '{}');
            } catch {
              parsedArgs = {};
            }
            toolCalls.push({
              id: tc.id,
              name: tc.function.name,
              args: parsedArgs,
            });
          } else if (chunk.type === 'error') {
            logger.error(chunk.error || 'Unknown error');
          }
        }

        process.stdout.write('\n');

        if (toolCalls.length === 0) {
          session.addMessage({ role: 'assistant', content: responseText || '(no response)' });
          break;
        }

        const assistantMsg: Message = {
          role: 'assistant',
          content: responseText || '',
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: JSON.stringify(tc.args) },
          })),
        };
        conversationMessages.push(assistantMsg);

        for (const tc of toolCalls) {
          const permission = isToolAllowed(tc.name, config);
          if (permission === 'deny') {
            logger.warn(`Tool "${tc.name}" blocked by permission rules`);
            conversationMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              name: tc.name,
              content: JSON.stringify({ success: false, output: '', error: `Blocked by permission rules` }),
            });
            continue;
          }

          if (permission === 'ask') {
            const { default: inquirer } = await import('inquirer');
            const { confirm } = await inquirer.prompt([{
              type: 'confirm',
              name: 'confirm',
              message: `Allow tool "${tc.name}"?`,
              default: false,
            }]);
            if (!confirm) {
              logger.warn(`Tool "${tc.name}" denied by user`);
              conversationMessages.push({
                role: 'tool',
                tool_call_id: tc.id,
                name: tc.name,
                content: JSON.stringify({ success: false, output: '', error: 'Denied by user' }),
              });
              continue;
            }
          }

          const preAllowed = await hookEngine.runPreTool(tc.name, tc.args);
          if (!preAllowed) {
            logger.warn(`Tool "${tc.name}" blocked by pre-tool hook`);
            conversationMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              name: tc.name,
              content: JSON.stringify({ success: false, output: '', error: 'Blocked by pre-tool hook' }),
            });
            continue;
          }

          logger.dim(`  → Using tool: ${tc.name}`);
          let result: ToolResult;
          try {
            result = await toolRegistry.execute(tc.name, tc.args);
          } catch (execErr) {
            result = { success: false, output: '', error: execErr instanceof Error ? execErr.message : String(execErr) };
          }

          hookEngine.runPostTool(tc.name, tc.args, result);

          conversationMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.name,
            content: JSON.stringify(result),
          });
        }
      }

      sessionStore.saveSession(session.getInfo().id, session.getMessages(), config.model || '');
    } catch (err) {
      logger.error('Error:', err instanceof Error ? err.message : String(err));
    }
  }
}



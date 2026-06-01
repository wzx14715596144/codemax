import type { Config } from '../config';
import type { Message } from '../provider/interface';
import { logger, getModelId } from '../utils';
import { AIProviderManager } from '../provider/manager';
import { registerBuiltInTools, toolRegistry } from '../tools';

export async function oneShotAction(prompt: string, config: Config) {
  const providerManager = new AIProviderManager(config);
  registerBuiltInTools();
  providerManager.initializeProviders();

  const provider = providerManager.getCurrentProvider();
  if (!provider) {
    logger.error('No AI provider configured');
    process.exit(1);
  }

  const messages: Message[] = [{ role: 'user', content: prompt }];
  const modelId = getModelId(config.model);
  const toolsDefs = toolRegistry.getAllDefinitions();
  const maxTurns = 10;

  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      const toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> = [];
      let responseText = '';

      const stream = provider.chat(messages, {
        model: modelId,
        tools: toolsDefs.length > 0 ? toolsDefs : undefined,
        stream: true,
        onToken: (token: string) => {
          process.stdout.write(token);
          responseText += token;
        },
      });

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
      messages.push(assistantMsg);

      for (const tc of toolCalls) {
        const result = await toolRegistry.execute(tc.name, tc.args);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: tc.name,
          content: JSON.stringify(result),
        });
      }
    }
  } catch (err) {
    logger.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}



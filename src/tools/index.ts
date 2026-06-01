import { toolRegistry } from './registry';
import { readTool } from './read';
import { writeTool } from './write';
import { editTool } from './edit';
import { bashTool } from './bash';
import { globTool } from './glob';
import { grepTool } from './grep';

export function registerBuiltInTools() {
  toolRegistry.register(readTool);
  toolRegistry.register(writeTool);
  toolRegistry.register(editTool);
  toolRegistry.register(bashTool);
  toolRegistry.register(globTool);
  toolRegistry.register(grepTool);
}

export { toolRegistry } from './registry';
export type { Tool, ToolResult } from './types';

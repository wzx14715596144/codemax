import type { Config, HookConfig } from '../config';
import { execSync } from 'child_process';
import { logger } from '../utils';

export class HookEngine {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async runPreTool(toolName: string, args: Record<string, unknown>): Promise<boolean> {
    return this.runHooks(this.config.hooks?.preTool || [], toolName, args);
  }

  async runPostTool(toolName: string, args: Record<string, unknown>, result: { success: boolean; output: string }): Promise<void> {
    // post-tool hooks are fire-and-forget
    const hooks = (this.config.hooks?.postTool || []).filter((h) =>
      this.matches(h.match, toolName),
    );
    for (const hook of hooks) {
      try {
        const script = this.interpolate(hook.script, { toolName, ...args, success: String(result.success) });
        execSync(script, { timeout: hook.timeout || 30000, windowsHide: true });
      } catch (err) {
        logger.warn(`Post-tool hook failed: ${hook.script}`);
      }
    }
  }

  private async runHooks(hooks: HookConfig[], toolName: string, args: Record<string, unknown>): Promise<boolean> {
    const matched = hooks.filter((h) => this.matches(h.match, toolName));
    for (const hook of matched) {
      try {
        const script = this.interpolate(hook.script, { toolName, ...args });
        execSync(script, { timeout: hook.timeout || 30000, windowsHide: true });
      } catch {
        logger.warn(`Pre-tool hook blocked: ${hook.script}`);
        return false;
      }
    }
    return true;
  }

  private matches(pattern: string, toolName: string): boolean {
    if (pattern === toolName) return true;
    try {
      return new RegExp(pattern).test(toolName);
    } catch {
      return false;
    }
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
  }
}

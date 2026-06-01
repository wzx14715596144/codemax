import type { Command } from './registry';
import { logger } from '../utils';
import * as fs from 'fs';

export const exportCommand: Command = {
  name: 'export',
  description: 'Export the current conversation',
  execute(_ctx) {
    const args = _ctx.input.slice('/export'.length).trim();
    const filename = args || `codemax-session-${Date.now()}.txt`;

    const messages = _ctx.session.getMessages();
    const lines: string[] = ['codemax Session Export', '====================', ''];
    for (const msg of messages) {
      const role = msg.role.toUpperCase();
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2);
      lines.push(`[${role}]`);
      lines.push(content);
      lines.push('');
    }

    fs.writeFileSync(filename, lines.join('\n'), 'utf-8');
    logger.success(`Conversation exported to ${filename}`);
  },
};

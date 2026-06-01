import type { Command } from './registry';
import { logger } from '../utils';

const HELP_TEXT = `
  CODEMAX — AI Coding Assistant

  Usage:
    codemax                    Start interactive session
    codemax <prompt>           Run a single prompt
    codemax config init        Initialize configuration
    codemax config show        Show current config
    codemax config set <k> <v> Set a config value

  Interactive Commands:
    /help        Show this help message
    /clear       Clear conversation context
    /exit        Exit the CLI
    /model       Switch AI model
    /config      Open configuration settings
    /status      Show version, model, and session info
    /plan        Enter plan mode
    /cost        Show token usage and cost
    /permissions Manage tool permissions
    /doctor      Diagnose installation and configuration
    /compact     Compact conversation context
    /diff        Show current uncommitted changes
    /review      Review current diff for issues
    /init        Initialize project with CODEMAX.md
    /export      Export conversation
    /mcp         Manage MCP server connections
    /skill       Manage skills
    /hooks       View hook configurations
    /agent       Manage subagent configurations
    /batch       Batch process large changes
    /background  Run a prompt in background without blocking conversation
    /btw         Ask a side question
    /rewind      Rewind to checkpoint
    /upgrade     Check for updates
    /feedback    Submit feedback
`;

export const helpCommand: Command = {
  name: 'help',
  aliases: ['?'],
  description: 'Show this help message',
  execute() {
    logger.info(HELP_TEXT);
  },
};

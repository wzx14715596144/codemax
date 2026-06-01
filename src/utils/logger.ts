import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const PREFIX = '✦';

function fmt(args: unknown[]): string {
  return args.map((a) => typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)).join(' ');
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.error(chalk.gray(`${PREFIX} [debug] ${fmt(args)}`));
    }
  }

  info(...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      console.error(chalk.cyan(`${PREFIX} ${fmt(args)}`));
    }
  }

  warn(...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      console.error(chalk.yellow(`${PREFIX} [warn] ${fmt(args)}`));
    }
  }

  error(...args: unknown[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(chalk.red(`${PREFIX} [error] ${fmt(args)}`));
    }
  }

  success(...args: unknown[]) {
    console.error(chalk.green(`\u2713 ${fmt(args)}`));
  }

  dim(...args: unknown[]) {
    console.error(chalk.dim(fmt(args)));
  }
}

export const logger = new Logger();

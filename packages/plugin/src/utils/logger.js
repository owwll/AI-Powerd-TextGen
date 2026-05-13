// ============================================================
// Logger Utility
// Lightweight structured logger for the plugin
// ============================================================

const LOG_LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

let currentLevel = 'info';

const COLORS = {
  reset: '\x1b[0m',
  error: '\x1b[31m',   // red
  warn:  '\x1b[33m',   // yellow
  info:  '\x1b[36m',   // cyan
  debug: '\x1b[35m',   // magenta
};

function format(level, message, meta = {}) {
  const ts = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${COLORS[level]}[${ts}] [${level.toUpperCase()}] [ai-content-gen] ${message}${metaStr}${COLORS.reset}`;
}

function log(level, message, meta) {
  if (LOG_LEVELS[level] <= LOG_LEVELS[currentLevel]) {
    const output = format(level, message, meta);
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
}

export const logger = {
  setLevel(level) {
    if (LOG_LEVELS[level] === undefined) {
      throw new Error(`Invalid log level: ${level}`);
    }
    currentLevel = level;
  },
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

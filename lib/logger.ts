/**
 * Production-safe logging helpers.
 *
 * `console.log` / `console.info` are development diagnostics: in production they
 * leak internal flow details (user ids, roles, counts, tokens) into platform
 * logs and add noise. `debug`/`debugInfo` keep that output available locally
 * while becoming no-ops in a production build.
 *
 * Errors and warnings are always forwarded because they matter in production.
 *
 * `process.env.NODE_ENV` is statically inlined by Next.js for both the server
 * and the client bundle, so these functions are tree-shaken down to nothing in
 * production client code.
 */

const isProduction = process.env.NODE_ENV === 'production';

type LogArgs = unknown[];

export function debug(...args: LogArgs): void {
  if (!isProduction) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function debugInfo(...args: LogArgs): void {
  if (!isProduction) {
    // eslint-disable-next-line no-console
    console.info(...args);
  }
}

export function debugWarn(...args: LogArgs): void {
  // eslint-disable-next-line no-console
  console.warn(...args);
}

export function logError(...args: LogArgs): void {
  // eslint-disable-next-line no-console
  console.error(...args);
}

import type { Logger, LogBindings, LogLevel } from "./types";

const levelOrder: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

function resolveClientLevel(): LogLevel {
  const raw =
    (process.env.NEXT_PUBLIC_LOG_LEVEL ||
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === "production" ? "info" : "debug")) as string;

  const normalized = raw.toLowerCase();
  if (
    normalized === "fatal" ||
    normalized === "error" ||
    normalized === "warn" ||
    normalized === "info" ||
    normalized === "debug" ||
    normalized === "trace"
  ) {
    return normalized;
  }

  return "info";
}

function isEnabled(min: LogLevel, current: LogLevel) {
  return levelOrder[min] >= levelOrder[current];
}

function fmt(bindings: LogBindings) {
  // Keep console output small (avoid dumping entire responses, bodies, etc.)
  return bindings;
}

function createNoopLogger(): Logger {
  const noop = () => undefined;
  return {
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
  };
}

export function createClientLogger(): Logger {
  if (process.env.NODE_ENV === "test") return createNoopLogger();

  const current = resolveClientLevel();
  const base = { service: "ui", runtime: "browser" } as const;

  return {
    fatal: (bindings, msg) => {
      if (!isEnabled("fatal", current)) return;
      console.error(msg, { ...base, ...fmt(bindings) });
    },
    error: (bindings, msg) => {
      if (!isEnabled("error", current)) return;
      console.error(msg, { ...base, ...fmt(bindings) });
    },
    warn: (bindings, msg) => {
      if (!isEnabled("warn", current)) return;
      console.warn(msg, { ...base, ...fmt(bindings) });
    },
    info: (bindings, msg) => {
      if (!isEnabled("info", current)) return;
      console.info(msg, { ...base, ...fmt(bindings) });
    },
    debug: (bindings, msg) => {
      if (!isEnabled("debug", current)) return;
      console.debug(msg, { ...base, ...fmt(bindings) });
    },
    trace: (bindings, msg) => {
      if (!isEnabled("trace", current)) return;
      console.debug(msg, { ...base, ...fmt(bindings) });
    },
  };
}


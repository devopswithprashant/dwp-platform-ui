import "server-only";
import pino, { type Logger as PinoLogger } from "pino";

import type { Logger, LogBindings, LogLevel } from "./types";

function resolveServerLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ||
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

function toLogger(p: PinoLogger): Logger {
  const wrap =
    (fn: (o: object, m?: string) => void) => (bindings: LogBindings, msg: string) =>
      fn(bindings ?? {}, msg);

  return {
    fatal: wrap(p.fatal.bind(p)),
    error: wrap(p.error.bind(p)),
    warn: wrap(p.warn.bind(p)),
    info: wrap(p.info.bind(p)),
    debug: wrap(p.debug.bind(p)),
    trace: wrap(p.trace.bind(p)),
  };
}

const pinoLogger = pino({
  level: resolveServerLevel(),
  messageKey: "message",
  base: {
    "service.name": process.env.SERVICE_NAME || "ui",
    "service.environment": process.env.NODE_ENV,
  },
  formatters: {
    level(label) {
      return { "log.level": label };
    },
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.set-cookie",
      "res.headers.set-cookie",
      "headers.authorization",
      "headers.cookie",
      "cookie",
      "authorization",
    ],
    censor: "[REDACTED]",
  },
  // ECS-friendly timestamp
  timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
  ...(process.env.NODE_ENV !== "production" && process.env.LOG_PRETTY === "1"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            messageKey: "message",
          },
        },
      }
    : {}),
});

export const serverLogger: Logger = toLogger(pinoLogger);


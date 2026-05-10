export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export type LogBindings = Record<string, unknown>;

export interface Logger {
  fatal(bindings: LogBindings, msg: string): void;
  error(bindings: LogBindings, msg: string): void;
  warn(bindings: LogBindings, msg: string): void;
  info(bindings: LogBindings, msg: string): void;
  debug(bindings: LogBindings, msg: string): void;
  trace(bindings: LogBindings, msg: string): void;
}


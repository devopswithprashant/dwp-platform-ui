import { createClientLogger } from "../logging/client";

describe("client logger", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL;
  const originalFallbackLevel = process.env.LOG_LEVEL;

  afterEach(() => {
    Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
    if (originalLogLevel === undefined) delete process.env.NEXT_PUBLIC_LOG_LEVEL;
    else Reflect.set(process.env, "NEXT_PUBLIC_LOG_LEVEL", originalLogLevel);
    if (originalFallbackLevel === undefined) delete process.env.LOG_LEVEL;
    else Reflect.set(process.env, "LOG_LEVEL", originalFallbackLevel);
    jest.restoreAllMocks();
  });

  it("uses a no-op logger in test mode", () => {
    Reflect.set(process.env, "NODE_ENV", "test");
    const logger = createClientLogger();

    expect(() => {
      logger.fatal({}, "message");
      logger.error({}, "message");
      logger.warn({}, "message");
      logger.info({}, "message");
      logger.debug({}, "message");
      logger.trace({}, "message");
    }).not.toThrow();
  });

  it("logs each severity with service bindings at trace level", () => {
    Reflect.set(process.env, "NODE_ENV", "development");
    Reflect.set(process.env, "NEXT_PUBLIC_LOG_LEVEL", "trace");
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const debug = jest.spyOn(console, "debug").mockImplementation(() => undefined);
    const logger = createClientLogger();
    const bindings = { requestId: "123" };

    logger.fatal(bindings, "fatal");
    logger.error(bindings, "error");
    logger.warn(bindings, "warn");
    logger.info(bindings, "info");
    logger.debug(bindings, "debug");
    logger.trace(bindings, "trace");

    expect(error).toHaveBeenNthCalledWith(1, "fatal", {
      service: "ui",
      runtime: "browser",
      requestId: "123",
    });
    expect(error).toHaveBeenNthCalledWith(2, "error", expect.any(Object));
    expect(warn).toHaveBeenCalledWith("warn", expect.any(Object));
    expect(info).toHaveBeenCalledWith("info", expect.any(Object));
    expect(debug).toHaveBeenNthCalledWith(1, "debug", expect.any(Object));
    expect(debug).toHaveBeenNthCalledWith(2, "trace", expect.any(Object));
  });

  it("falls back to info for invalid levels and filters lower severities", () => {
    Reflect.set(process.env, "NODE_ENV", "development");
    Reflect.set(process.env, "NEXT_PUBLIC_LOG_LEVEL", "verbose");
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const debug = jest.spyOn(console, "debug").mockImplementation(() => undefined);
    const logger = createClientLogger();

    logger.fatal({}, "fatal");
    logger.error({}, "error");
    logger.warn({}, "warn");
    logger.info({}, "info");
    logger.debug({}, "debug");
    logger.trace({}, "trace");

    expect(error).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
    expect(debug).not.toHaveBeenCalled();
  });
});

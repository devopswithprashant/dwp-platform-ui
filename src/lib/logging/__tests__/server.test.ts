/** @jest-environment node */

const mockPinoLogger = {
  fatal: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
};

jest.mock("server-only", () => ({}));

describe("server logger", () => {
  const originalEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_PRETTY: process.env.LOG_PRETTY,
    SERVICE_NAME: process.env.SERVICE_NAME,
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock("pino", () => ({
      __esModule: true,
      default: jest.fn(() => mockPinoLogger),
    }));
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_PRETTY;
    delete process.env.SERVICE_NAME;
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("wraps every pino level with bindings and a message", async () => {
    Reflect.set(process.env, "NODE_ENV", "production");
    const { serverLogger } = await import("../server");

    for (const level of ["fatal", "error", "warn", "info", "debug", "trace"] as const) {
      serverLogger[level]({ requestId: "request-1" }, "request event");
      expect(mockPinoLogger[level]).toHaveBeenCalledWith(
        { requestId: "request-1" },
        "request event",
      );
    }
  });

  it("uses production defaults and falls back to info for unsupported levels", async () => {
    Reflect.set(process.env, "NODE_ENV", "production");
    process.env.LOG_LEVEL = "verbose";
    const pino = (await import("pino")).default;

    await import("../server");

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        base: {
          "service.name": "ui",
          "service.environment": "production",
        },
      }),
    );
  });

  it("normalizes explicit levels and enables pretty transport outside production", async () => {
    Reflect.set(process.env, "NODE_ENV", "development");
    process.env.LOG_LEVEL = "TRACE";
    process.env.LOG_PRETTY = "1";
    process.env.SERVICE_NAME = "blog-ui";
    const pino = (await import("pino")).default;

    await import("../server");

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "trace",
        base: {
          "service.name": "blog-ui",
          "service.environment": "development",
        },
        transport: expect.objectContaining({ target: "pino-pretty" }),
      }),
    );
  });
});

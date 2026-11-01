/** @jest-environment node */

import { POST } from "../route";
import { serverLogger } from "@/lib/logging/server";

jest.mock("@/lib/logging/server", () => ({
  serverLogger: {
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  },
}));

describe("client log POST route", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
    jest.clearAllMocks();
  });

  it("returns a bad request for invalid JSON", async () => {
    const response = await POST({
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it.each([
    ["fatal", "fatal"],
    ["error", "error"],
    ["warn", "warn"],
    ["info", "info"],
    ["debug", "debug"],
    ["trace", "trace"],
  ] as const)("routes %s payloads to the matching logger", async (level, method) => {
    Reflect.set(process.env, "NODE_ENV", "development");
    const response = await POST({
      json: async () => ({
        level,
        msg: "client event",
        bindings: { page: "/blogs" },
        ts: "2026-11-01T10:00:00Z",
      }),
    } as unknown as Request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(serverLogger[method]).toHaveBeenCalledWith(
      expect.objectContaining({
        page: "/blogs",
        runtime: "browser",
        receivedAt: expect.any(String),
        ts: "2026-11-01T10:00:00Z",
      }),
      "client event",
    );
  });

  it("uses defaults for absent fields", async () => {
    Reflect.set(process.env, "NODE_ENV", "development");
    await POST({ json: async () => ({}) } as unknown as Request);

    expect(serverLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ runtime: "browser" }),
      "client.log",
    );
  });

  it("logs only warning and higher in production", async () => {
    Reflect.set(process.env, "NODE_ENV", "production");

    await POST({ json: async () => ({ level: "info" }) } as unknown as Request);
    await POST({ json: async () => ({ level: "warn" }) } as unknown as Request);

    expect(serverLogger.info).not.toHaveBeenCalled();
    expect(serverLogger.warn).toHaveBeenCalledTimes(1);
  });
});

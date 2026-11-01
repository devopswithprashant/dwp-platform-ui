/** @jest-environment node */

jest.mock("server-only", () => ({}));

import {
  getMetricsContentType,
  getMetricsPayload,
  getUiMetrics,
} from "../metrics/server";

describe("UI metrics", () => {
  beforeEach(() => {
    Reflect.deleteProperty(globalThis, "__uiMetrics");
  });

  it("initializes and caches its registry and HTTP client metrics", () => {
    const metrics = getUiMetrics();

    expect(getUiMetrics()).toBe(metrics);
    expect(metrics.registry.getMetricsAsArray().map((metric) => metric.name)).toEqual(
      expect.arrayContaining([
        "ui_http_client_requests_total",
        "ui_http_client_request_duration_seconds",
        "ui_http_client_errors_total",
      ]),
    );
  });

  it("exposes a Prometheus payload and content type", async () => {
    const metrics = getUiMetrics();
    metrics.httpClientRequestsTotal.inc({
      operation: "test",
      method: "GET",
      status_code: "200",
    });

    await expect(getMetricsPayload()).resolves.toContain("ui_http_client_requests_total");
    expect(getMetricsContentType()).toContain("text/plain");
  });
});

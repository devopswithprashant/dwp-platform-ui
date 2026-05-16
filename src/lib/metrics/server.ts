import "server-only";

import client from "prom-client";

const globalForMetrics = globalThis as typeof globalThis & {
  __uiMetricsRegistry?: client.Registry;
};

function getRegistry(): client.Registry {
  if (!globalForMetrics.__uiMetricsRegistry) {
    const registry = new client.Registry();
    registry.setDefaultLabels({
      service: process.env.SERVICE_NAME || "ui",
      environment: process.env.NODE_ENV || "development",
    });
    client.collectDefaultMetrics({
      register: registry,
      prefix: "nodejs_",
    });
    globalForMetrics.__uiMetricsRegistry = registry;
  }
  return globalForMetrics.__uiMetricsRegistry;
}

export const registry = getRegistry();

export const httpClientRequestsTotal = new client.Counter({
  name: "ui_http_client_requests_total",
  help: "Total outbound HTTP requests from the UI server to the blog API",
  labelNames: ["operation", "method", "status_code"] as const,
  registers: [registry],
});

export const httpClientRequestDurationSeconds = new client.Histogram({
  name: "ui_http_client_request_duration_seconds",
  help: "Outbound HTTP request duration from the UI server to the blog API",
  labelNames: ["operation", "method"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const httpClientErrorsTotal = new client.Counter({
  name: "ui_http_client_errors_total",
  help: "Total outbound HTTP request failures (network/timeout) from the UI server",
  labelNames: ["operation", "method"] as const,
  registers: [registry],
});

export async function getMetricsPayload(): Promise<string> {
  return registry.metrics();
}

export function getMetricsContentType(): string {
  return registry.contentType;
}

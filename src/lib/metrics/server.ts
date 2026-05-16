import "server-only";

import client from "prom-client";

type HttpClientRequestLabels = "operation" | "method" | "status_code";
type HttpClientDurationLabels = "operation" | "method";
type HttpClientErrorLabels = "operation" | "method";

type UiMetrics = {
  registry: client.Registry;
  httpClientRequestsTotal: client.Counter<HttpClientRequestLabels>;
  httpClientRequestDurationSeconds: client.Histogram<HttpClientDurationLabels>;
  httpClientErrorsTotal: client.Counter<HttpClientErrorLabels>;
};

const globalForMetrics = globalThis as typeof globalThis & {
  __uiMetrics?: UiMetrics;
};

/** Single init per Node process — avoids duplicate registration when Next re-evaluates modules. */
export function getUiMetrics(): UiMetrics {
  if (globalForMetrics.__uiMetrics) {
    return globalForMetrics.__uiMetrics;
  }

  const registry = new client.Registry();
  registry.setDefaultLabels({
    service: process.env.SERVICE_NAME || "ui",
    environment: process.env.NODE_ENV || "development",
  });

  client.collectDefaultMetrics({
    register: registry,
    prefix: "nodejs_",
  });

  const httpClientRequestsTotal = new client.Counter({
    name: "ui_http_client_requests_total",
    help: "Total outbound HTTP requests from the UI server to the blog API",
    labelNames: ["operation", "method", "status_code"] as const,
    registers: [registry],
  });

  const httpClientRequestDurationSeconds = new client.Histogram({
    name: "ui_http_client_request_duration_seconds",
    help: "Outbound HTTP request duration from the UI server to the blog API",
    labelNames: ["operation", "method"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  const httpClientErrorsTotal = new client.Counter({
    name: "ui_http_client_errors_total",
    help: "Total outbound HTTP request failures (network/timeout) from the UI server",
    labelNames: ["operation", "method"] as const,
    registers: [registry],
  });

  globalForMetrics.__uiMetrics = {
    registry,
    httpClientRequestsTotal,
    httpClientRequestDurationSeconds,
    httpClientErrorsTotal,
  };

  return globalForMetrics.__uiMetrics;
}

export async function getMetricsPayload(): Promise<string> {
  return getUiMetrics().registry.metrics();
}

export function getMetricsContentType(): string {
  return getUiMetrics().registry.contentType;
}

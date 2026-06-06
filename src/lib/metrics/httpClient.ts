import "server-only";

import { getUiMetrics } from "./server";

export function recordHttpClientMetrics(
  operation: string,
  method: string,
  statusCode: number | "error",
  durationSeconds: number
): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const {
    httpClientRequestsTotal,
    httpClientRequestDurationSeconds,
    httpClientErrorsTotal,
  } = getUiMetrics();

  const statusLabel = statusCode === "error" ? "error" : String(statusCode);

  httpClientRequestsTotal.inc({
    operation,
    method,
    status_code: statusLabel,
  });
  httpClientRequestDurationSeconds.observe({ operation, method }, durationSeconds);

  if (statusCode === "error") {
    httpClientErrorsTotal.inc({ operation, method });
  }
}

## Logging (Production + ELK compatible)

This UI service uses **structured JSON logs** (server-side) and a safe **browser logger** (client-side). The goal is:

- **Production-safe logs**: no secrets, consistent fields, environment-driven log levels.
- **ELK-friendly**: JSON logs with stable keys; correlation via a request/trace id.
- **Microservice ready**: logs include identifiers that can be propagated through Nginx to downstream services.

---

## Where logging happens

- **Server-side (Next.js runtime)**: `src/lib/logging/server.ts`
  - Uses **Pino** to write structured JSON logs to stdout.
  - Logs are intended to be shipped by your container log collector (Filebeat/Fluent Bit) into Elasticsearch.

- **Client-side (browser runtime)**: `src/lib/logging/client.ts`
  - Logs to the browser console (disabled during tests).
  - Optional: you can forward browser logs to the server via `POST /api/ui-logs` (see below).

- **API calls (fetch wrapper)**: `src/lib/api.ts`
  - All outgoing calls to the blog service go through `loggedFetch(...)`.
  - Emits request/response/error events with correlation id and latency.

---

## Log format (ELK / ECS-friendly fields)

The server logger is configured to emit JSON with a timestamp and fields that map well to ECS.

- **Timestamp**: `@timestamp` (ISO-8601)
- **Service identity**:
  - `service.name` (defaults to `"ui"`, overridable by `SERVICE_NAME`)
  - `service.environment` (from `NODE_ENV`)
- **Log level**: `log.level` (e.g. `info`, `warn`, `error`)
- **Message**: `message`

For outbound HTTP calls (`src/lib/api.ts`), we log:

- **Correlation id**: `trace.id`
  - Also sent to downstream services as request header `x-request-id`.
- **HTTP fields**:
  - `http.request.method`
  - `url.full`
  - `http.response.status_code` (on response)
- **Event fields**:
  - `event.action` (operation name like `fetchBlogs`, `createBlog`)
  - `event.duration` (nanoseconds, compatible with ECS)

### Example server log event (shape)

```json
{
  "@timestamp": "2026-05-03T15:40:12.123Z",
  "service.name": "ui",
  "service.environment": "production",
  "log.level": "info",
  "message": "http.response",
  "event.action": "fetchBlogs",
  "trace.id": "7d2e6e5a-7b27-49e3-a63e-0a2bf9f8a34a",
  "http.request.method": "GET",
  "url.full": "http://blog-service:9090/api/blogs",
  "http.response.status_code": 200,
  "event.duration": 112000000
}
```

---

## Redaction / secrets

Server logs redact common sensitive fields (authorization and cookies) using Pino’s `redact` option.

Redacted values appear as: `[REDACTED]`.

If you add more services/endpoints that carry tokens in other keys, add them to:

- `src/lib/logging/server.ts` → `redact.paths`

---

## Configuration (environment variables)

- **`LOG_LEVEL`**: server log level
  - Recommended production default: `info` (or `warn` for very low noise)
  - Recommended non-prod: `debug` while developing/triaging

- **`NEXT_PUBLIC_LOG_LEVEL`**: browser log level
  - If set, controls client logger verbosity (otherwise defaults to `debug` in dev and `info` in prod).

- **`SERVICE_NAME`**: service identity for logs
  - Default: `ui`

- **`LOG_PRETTY=1`** (non-production only):
  - Enables Pino pretty output locally for readability.
  - In production, keep this **off** so logs remain JSON for ELK ingestion.

---

## Nginx & correlation id (recommended)

To correlate requests across microservices, make sure a request id exists at the edge and is forwarded:

- Incoming request gets/has `X-Request-Id`
- Nginx proxies the same id to upstream services as `X-Request-Id`

Your `src/lib/api.ts` generates and forwards an `x-request-id` on outbound requests.
For end-to-end correlation across UI + API services, consider also setting/forwarding it in Nginx.

Update `nginx.conf` (both `/api/` and `/` locations) to forward request id:

```nginx
proxy_set_header X-Request-Id $request_id;
```

If you already have an incoming `X-Request-Id` from a load balancer/API gateway, you can prefer that:

```nginx
proxy_set_header X-Request-Id $http_x_request_id;
```

Pick one approach consistently across the platform.

---

## Shipping to ELK (typical setup)

### Container logging (recommended)

In production, run the Next.js app so server logs go to **stdout/stderr** (default behavior). Then:

- **Filebeat** or **Fluent Bit** reads container logs
- Parses JSON
- Ships to Elasticsearch

Because logs are already JSON, avoid regex parsing when possible.

### Nginx logs (how ELK captures them)

Nginx produces **access** and **error** logs. With ELK you typically capture them one of two ways:

- **Recommended (Kubernetes / containers)**: configure Nginx to write logs to **stdout/stderr**, then your log collector ships container logs to Elasticsearch.
  - Access log → `/dev/stdout`
  - Error log → `/dev/stderr`
- **Alternative (file tailing)**: keep logs as files (e.g. `/var/log/nginx/access.log`, `/var/log/nginx/error.log`) and run Filebeat/Fluent Bit to tail those paths (usually via a mounted volume).

For best results in ELK:

- **Emit JSON access logs** (so you don’t depend on Grok/regex parsing).
- **Include a request id** in Nginx access logs (e.g. `$request_id` or `$http_x_request_id`) so you can correlate:
  - Nginx access log ↔ Next.js server logs (`trace.id`) ↔ backend service logs.

### Indexing / dashboards

Create Kibana dashboards with filters like:

- `service.name: ui`
- `log.level: error OR warn`
- `trace.id: <uuid>`
- `event.action: createBlog`

This lets you follow a request across services (UI → blog service) using the shared correlation id.

---

## Browser logs (optional forwarding)

There is a route handler at:

- `POST /api/ui-logs` → `src/app/api/ui-logs/route.ts`

By default it:

- Accepts a small payload `{ level, msg, bindings, ts }`
- Logs **warn+ only in production** (to avoid high-volume noise)

If you decide to forward browser logs to ELK later, this endpoint is the intended bridge.

---

## Operational guidance / best practices

- **Do not log payload bodies** by default (PII risk, volume risk).
- **Prefer stable, searchable keys** over big free-form messages.
- **Keep prod verbosity low** (`info` or `warn`).
- **Use correlation id everywhere** so incidents are traceable across microservices.
- **Redact aggressively** (cookies/tokens) and expand redaction list as needed.


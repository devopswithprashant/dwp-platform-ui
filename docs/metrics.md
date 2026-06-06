# Metrics (Prometheus + Grafana)

This UI service exposes **Prometheus metrics** for server-side behavior, **Nginx metrics** via a sidecar exporter, and supports **synthetic HTTP probes** through Blackbox exporter.

Logs remain in ELK (see `docs/logging.md`). Metrics are for SLOs, dashboards, and alerting.

---

## Server metrics (`prom-client`)

**Endpoint:** `GET /api/metrics` (Next.js, port 3000)

**Instrumentation:** `src/lib/api.server.ts` → `loggedFetch` records:

| Metric | Type | Labels |
|--------|------|--------|
| `ui_http_client_requests_total` | Counter | `operation`, `method`, `status_code` |
| `ui_http_client_request_duration_seconds` | Histogram | `operation`, `method` |
| `ui_http_client_errors_total` | Counter | `operation`, `method` |
| `nodejs_*` / `process_*` | Default | `service`, `environment` |

Default labels: `service` (`SERVICE_NAME`, default `ui`), `environment` (`NODE_ENV`).

Nginx can proxy `/metrics` → Next.js for in-pod access (restricted by IP in `nginx.conf`).

---

## Nginx metrics

**stub_status:** `GET /nginx_status` (127.0.0.1 only)

**Exporter:** `nginx-prometheus-exporter` sidecar in Kubernetes (`k8s/ui/deployment.yaml`), port **9113**.

Typical metrics: `nginx_connections_*`, `nginx_http_requests_total`, etc.

---

## Synthetic checks (Blackbox)

Prometheus probes via Blackbox exporter:

- `http://dwp-platform-ui.../health` — liveness-style check
- `http://dwp-platform-ui.../` — home page availability

Probe results appear as `probe_success`, `probe_duration_seconds`, etc.

Configured in `monitoring/prometheus-configmap.yaml` job `blackbox-dwp-platform-ui`.

---

## Kubernetes

**Central monitoring stack** (Prometheus + Grafana + Blackbox):

```bash
kubectl apply -k monitoring/
```

**UI workload** (separate):

```bash
kubectl apply -k k8s/
```

Prometheus in `monitoring/` discovers UI pods via Kubernetes SD (`dwp-platform-ui`, `dwp-platform-ui-nginx`) and probes the UI Service via Blackbox (`blackbox-dwp-platform-ui`).

See `k8s/README.md` for UI deployment details and port-forwards.

---

## Local / docker-compose

Metrics are available when the Next.js server runs:

```bash
curl -s http://localhost:3000/api/metrics
```

With the production container (Nginx + Next.js), port-forward or exec:

```bash
curl -s http://localhost:3000/api/metrics   # if 3000 is exposed
curl -s http://127.0.0.1/nginx_status      # inside container only
```

---

## Grafana dashboards

Import or build panels using:

- `rate(ui_http_client_requests_total[5m])` by `operation`, `status_code`
- `histogram_quantile(0.95, sum(rate(ui_http_client_request_duration_seconds_bucket[5m])) by (le, operation))`
- `probe_success{job="blackbox-ui-health"}`
- Nginx exporter metrics for edge request volume and connections

---

## Security

- Do not expose `/api/metrics` or `/nginx_status` on the public internet.
- Scrape from cluster-internal Prometheus only; use `NetworkPolicy` where required.
- Keep cardinality low: no `trace.id` or full URLs in metric labels.

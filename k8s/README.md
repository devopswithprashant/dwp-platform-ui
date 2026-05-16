# Kubernetes manifests — UI metrics, Prometheus, Grafana

Manifests for deploying **dwp-platform-ui**. The central **monitoring** stack (Prometheus, Grafana, Blackbox) lives in [`monitoring/`](../monitoring/).

## Layout

| Path | Purpose |
|------|---------|
| `namespaces.yaml` | `dwp-platform` (app) and `monitoring` (observability) |
| `ui/deployment.yaml` | UI container + **nginx-prometheus-exporter** sidecar |
| `ui/service.yaml` | Ports `80` (HTTP), `3000` (Next.js metrics), `9113` (Nginx metrics) |
| `ui/servicemonitor.yaml` | Optional — for [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator) |
| [`monitoring/`](../monitoring/) | Central Prometheus, Grafana, Blackbox (scrapes UI + blog-service) |

## Prerequisites

1. Build and push the UI image from this repo (`Dockerfile`), then set the image in `ui/deployment.yaml`.
2. Deploy the blog backend as `blog-service` in `dwp-platform` (or update `BACKEND_SERVICE_HOST`).
3. A Kubernetes cluster (1.24+ recommended).

## Apply

```bash
# UI + namespaces
kubectl apply -k k8s/

# Central Prometheus + Grafana (scrapes UI metrics)
kubectl apply -k monitoring/
```

## Access (port-forward)

```bash
# Grafana (default admin / changeme — change grafana-secret.yaml first)
kubectl -n monitoring port-forward svc/grafana 3000:3000

# Prometheus UI
kubectl -n monitoring port-forward svc/prometheus 9090:9090
```

## Metrics endpoints

| Source | URL (in-cluster) | Prometheus job |
|--------|------------------|----------------|
| Next.js (`prom-client`) | `http://dwp-platform-ui:3000/api/metrics` | `dwp-platform-ui-nextjs` |
| Nginx exporter sidecar | `http://dwp-platform-ui:9113/metrics` | `dwp-platform-ui-nginx` |
| Blackbox (synthetic) | via `blackbox-exporter:9115/probe` | `blackbox-ui-health` |

Nginx `stub_status` is exposed at `/nginx_status` (localhost only). The sidecar scrapes it on `127.0.0.1:80`.

## Central Prometheus elsewhere

If Prometheus runs outside this repo, copy scrape jobs from `monitoring/prometheus-configmap.yaml` (`dwp-platform-ui`, `dwp-platform-ui-nginx`, `blackbox-dwp-platform-ui`) into your server config.

## Production notes

- Replace `grafana-secret.yaml` credentials and use sealed-secrets or external secret management.
- Use persistent volumes for Prometheus TSDB and Grafana in production.
- Restrict metrics ports with `NetworkPolicy` (scrape only from Prometheus namespace).
- For HA Prometheus/Grafana, use your platform’s standard stack (e.g. kube-prometheus-stack) and keep only `ui/*` manifests from this repo.

See also: `docs/metrics.md`.

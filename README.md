Distributed Payment Processing Platform

A production-grade distributed payment processing system built with **Spring Boot 3**, **Go**, **React**, and **Kafka** — featuring full observability, resilience patterns, a modern UI with dark/light theme, and automated audit logging.

---

## Architecture

```
Browser (React UI)
      ↓
Payment API (Spring Boot · :8080)
      ↓                    ↓                    ↓
PostgreSQL           Kafka (payment.events)   Audit Service (:8082)
                          ↓             ↓
             Notification Service   Notification Service Go
               (Java · :8081)         (Go · :9095)

Observability: Prometheus · Grafana · Zipkin
Frontend:      React + MUI · Nginx (Docker · :3001)
```

---

## Services

| Service                    | Port | Language   | Description                                          |
|----------------------------|------|------------|------------------------------------------------------|
| `payment-api`              | 8080 | Java       | REST API with idempotency + circuit breaker          |
| `notification-service`     | 8081 | Java       | Kafka consumer, sends async payment alerts           |
| `audit-service`            | 8082 | Java       | gRPC/REST endpoint logging all state transitions     |
| `notification-service-go`  | 9095 | Go         | Pure-Go Kafka consumer with Prometheus metrics       |
| `frontend`                 | 3001 | React/TS   | PayFlow UI — login, payments, audit logs, metrics    |
| PostgreSQL                 | 5432 | —          | Payment state store                                  |
| Kafka + Zookeeper          | 9092 | —          | Async event bus                                      |
| Zipkin                     | 9411 | —          | Distributed tracing UI                               |
| Prometheus                 | 9090 | —          | Metrics collection                                   |
| Grafana                    | 3000 | —          | Dashboards (admin/admin)                             |

---

## Prerequisites

- **Java 21** + Maven 3.9+
- **Go 1.22+**
- **Docker Desktop**
- **Node.js 20+** (only needed if running frontend outside Docker)

---

## Quick Start

### Step 1 — Start infrastructure (Docker)

```bash
cd "distributed-payment-service-fullstack new"
docker-compose up -d
```

This starts: PostgreSQL, Kafka, Zookeeper, Prometheus, Grafana, Zipkin, and the React frontend.

### Step 2 — Start backend services (5 terminals)

**Terminal 2 — Payment API**
```bash
cd payment-api
mvn spring-boot:run
```

**Terminal 3 — Java Notification Service**
```bash
cd notification-service
mvn spring-boot:run
```

**Terminal 4 — Audit Service**
```bash
cd audit-service
mvn spring-boot:run
```

**Terminal 5 — Go Notification Service**
```bash
cd notification-service-go
go run .
```

> Wait for Terminals 2, 3, 4 to show `Started ... in X seconds` before proceeding.

### Step 3 — Open the UI

Go to **http://localhost:3001**

**Demo credentials:**

| Username | Password  | Role              |
|----------|-----------|-------------------|
| `admin`  | `admin123`| Administrator     |
| `gauri`  | `gauri123`| Backend Engineer  |
| `demo`   | `demo123` | Viewer            |

---

## API Usage

### Create a payment
```bash
curl -X POST http://localhost:8080/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "test-001",
    "sourceAccount": "ACC001",
    "destinationAccount": "ACC002",
    "amount": 500.00,
    "currency": "INR"
  }'
```

### Get payments by account
```bash
curl http://localhost:8080/api/v1/payments/account/ACC001
```

### Reverse a payment
```bash
curl -X POST http://localhost:8080/api/v1/payments/{id}/reverse
```

### Check audit logs
```bash
curl http://localhost:8082/api/v1/audit
```

### Go service metrics
```bash
curl http://localhost:9095/metrics | grep notifications_go
curl http://localhost:9095/health
```

---

## UI Features

- 🔐 **Login / Logout** — role-based user sessions
- 🌙 ☀️ **Dark / Light theme** — toggle via sun/moon button in top bar
- 📊 **Dashboard** — live stats, request rate chart, payment status breakdown
- 💳 **Payments** — create, view, reverse payments across all accounts
- 📋 **Audit Logs** — automatic state transition logs (PENDING→PROCESSING→COMPLETED)
- 🔔 **Notifications** — payment event feed
- 📈 **Metrics** — Prometheus metrics viewer

---

## Observability

| Tool       | URL                                   | Credentials |
|------------|---------------------------------------|-------------|
| Swagger UI | http://localhost:8080/swagger-ui.html | —           |
| Prometheus | http://localhost:9090                 | —           |
| Grafana    | http://localhost:3000                 | admin/admin |
| Zipkin     | http://localhost:9411                 | —           |

---

## Key Design Decisions

- **Idempotency** — Every payment requires an `idempotencyKey`. Duplicate requests return the original result without re-processing.
- **Circuit Breaker** — Resilience4j opens the circuit after 50% failure rate, preventing cascade failures.
- **Automatic Audit Logging** — Payment API calls Audit Service on every state transition automatically.
- **Structured JSON Logging** — All logs include `traceId` and `spanId` for end-to-end correlation.
- **Pure-Go Kafka Consumer** — Uses `segmentio/kafka-go` (no CGO/librdkafka dependency) for portability.
- **Kafka Exactly-Once** — Idempotent producer with `acks=all` and `retries=3`.

---

## Run Tests

```bash
cd payment-api && mvn test
cd notification-service && mvn test
cd audit-service && mvn test
```

---

## Stopping Everything

```bash
# Stop Java/Go services: Ctrl+C in each terminal

# Stop Docker containers
docker-compose down
```

---

## Tech Stack

| Layer            | Technology                                 |
|------------------|--------------------------------------------|
| Backend          | Spring Boot 3.3, Java 21, Go 1.22          |
| Messaging        | Apache Kafka 3.7                           |
| Database         | PostgreSQL 16                              |
| Frontend         | React 18, TypeScript, Material UI v5       |
| Observability    | Prometheus, Grafana, Zipkin, Micrometer    |
| Resilience       | Resilience4j (Circuit Breaker, Retry)      |
| Containerisation | Docker, Docker Compose                     |
| CI/CD            | GitHub Actions                             |
| K8s Deploy       | Helm, Minikube                             |

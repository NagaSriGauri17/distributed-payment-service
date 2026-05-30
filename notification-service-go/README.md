# notification-service-go

A Go re-implementation of `notification-service` (Java/Spring Boot) that consumes the same `payment.events` Kafka topic. Both services run simultaneously as independent consumer groups — the Java service on `notification-group`, this one on `notification-group-go`.

## Why it exists

Demonstrates Go proficiency alongside the existing Java microservices, covering the same distributed-systems patterns:

| Feature | Java service | Go service |
|---|---|---|
| Kafka consumer | `spring-kafka` `@KafkaListener` | `confluent-kafka-go` |
| Manual offset commit | Spring `AckMode.BATCH` | `CommitMessage()` after processing |
| Event deserialization | Spring `JsonDeserializer` | `encoding/json` |
| Metrics | Micrometer → Prometheus | `prometheus/client_golang` |
| Health endpoint | Spring Actuator `/health` | stdlib `net/http` `/health` |
| Structured logging | Logback JSON | `log/slog` JSON handler |
| Graceful shutdown | Spring context close | `signal.NotifyContext` + `server.Shutdown` |

## Structure

```
notification-service-go/
├── main.go        # All logic in one file — intentional for a focused service
├── go.mod
├── Dockerfile
└── README.md
```

## Run locally

### Prerequisites
- Go 1.22+
- Running Kafka on `localhost:9092` (use the project's `docker-compose up -d`)

```bash
cd notification-service-go
go mod tidy
go run .
```

Service starts consuming `payment.events` immediately. Metrics exposed at `http://localhost:9095/metrics`, health at `http://localhost:9095/health`.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker(s) |
| `KAFKA_TOPIC` | `payment.events` | Topic to consume |
| `KAFKA_GROUP_ID` | `notification-group-go` | Consumer group |
| `METRICS_ADDR` | `:9095` | Prometheus + health bind address |

### Docker

```bash
docker build -t notification-service-go .
docker run --network host \
  -e KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
  notification-service-go
```

## Add to docker-compose.yml

Add this block to the root `docker-compose.yml` to run alongside the Java service:

```yaml
  notification-service-go:
    build: ./notification-service-go
    container_name: notification-service-go
    depends_on:
      kafka:
        condition: service_healthy
    environment:
      KAFKA_BOOTSTRAP_SERVERS: payment-kafka:9092
      KAFKA_TOPIC: payment.events
      KAFKA_GROUP_ID: notification-group-go
      METRICS_ADDR: :9095
    ports:
      - "9095:9095"
    networks:
      - payment-network
```

## Add to Prometheus config

Add this scrape job to `monitoring/prometheus/prometheus.yml`:

```yaml
  - job_name: 'notification-service-go'
    static_configs:
      - targets: ['notification-service-go:9095']
```

## Prometheus metrics exposed

| Metric | Type | Description |
|---|---|---|
| `notifications_go_events_processed_total{event_type}` | Counter | Events processed, labelled by type |
| `notifications_go_events_failed_total` | Counter | Events that failed (bad JSON, panic) |

## Key design decisions

**Manual offset commit** — `enable.auto.commit=false` + `CommitMessage()` after `ProcessEvent()` completes. This matches the Java service's at-least-once guarantee. If the process dies mid-event, Kafka redelivers to the next consumer instance in the group.

**Panic recovery** — a `defer recover()` wraps each event's processing so a single bad event cannot crash the consumer loop — mirrors the Java `try/catch` in `PaymentEventConsumer.java`.

**Same topic, different group** — `notification-group-go` is independent from `notification-group`. Both receive every message. This is intentional: the two services are parallel consumers, not competing ones. In production you'd promote one and retire the other.

**Single file** — `main.go` contains all types and logic. A Go service this size does not need packages; keeping it flat makes the code easier to review in an interview context.

# Distributed Payment Processing Service

A production-grade distributed payment processing system built with **Spring Boot 3**, demonstrating microservices, observability, resilience patterns, and cloud-native deployment.

## Architecture

```
Client → Payment API (REST + Circuit Breaker)
              ↓              ↓
         PostgreSQL       Kafka (payment.events)
                              ↓
                    Notification Service (Consumer)

Payment API → Audit Service (gRPC/REST)

Observability: Prometheus + Grafana + Zipkin
CI/CD: GitHub Actions → Docker → Helm → Minikube
```

## Services

| Service              | Port | Description                                      |
|----------------------|------|--------------------------------------------------|
| payment-api          | 8080 | REST API with idempotency + circuit breaker      |
| notification-service | 8081 | Kafka consumer, sends async alerts               |
| audit-service        | 8082 | gRPC/REST endpoint logging all state transitions |
| PostgreSQL           | 5432 | Payment state store                              |
| Kafka                | 9092 | Async event bus                                  |
| Zipkin               | 9411 | Distributed tracing UI                           |
| Prometheus           | 9090 | Metrics collection                               |
| Grafana              | 3000 | Dashboards (admin/admin)                         |

## Prerequisites

- Java 21, Maven 3.9+
- Docker Desktop
- Minikube + Helm (for k8s deploy)

## Run Locally (Quickstart)

### 1. Start infrastructure
```bash
docker-compose up -d
```

### 2. Build all services
```bash
cd payment-api && mvn clean package -DskipTests && cd ..
cd notification-service && mvn clean package -DskipTests && cd ..
cd audit-service && mvn clean package -DskipTests && cd ..
```

### 3. Run services (3 separate terminals)
```bash
# Terminal 1
cd payment-api && mvn spring-boot:run

# Terminal 2
cd notification-service && mvn spring-boot:run

# Terminal 3
cd audit-service && mvn spring-boot:run
```

### 4. Test the API
```bash
# Create a payment
curl -X POST http://localhost:8080/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "test-key-001",
    "sourceAccount": "ACC-001",
    "destinationAccount": "ACC-002",
    "amount": 250.00,
    "currency": "GBP",
    "description": "Invoice payment"
  }'

# Get payment by ID (replace with actual ID from above)
curl http://localhost:8080/api/v1/payments/{id}

# Get payments by account
curl http://localhost:8080/api/v1/payments/account/ACC-001

# Reverse a payment
curl -X POST http://localhost:8080/api/v1/payments/{id}/reverse
```

### 5. Explore observability
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Zipkin**: http://localhost:9411
- **Actuator/Metrics**: http://localhost:8080/actuator/prometheus

## Trigger a Failure & Observe in Grafana

### Simulate circuit breaker opening:
```bash
# Send many requests rapidly to trigger failure threshold
for i in {1..20}; do
  curl -X POST http://localhost:8080/api/v1/payments \
    -H "Content-Type: application/json" \
    -d "{\"idempotencyKey\":\"stress-$i\",\"sourceAccount\":\"FAIL\",\"destinationAccount\":\"ACC-999\",\"amount\":1.00,\"currency\":\"GBP\"}"
done
```

Watch in Grafana:
1. Open http://localhost:3000
2. Go to **Payment Processing Service** dashboard
3. Watch **Circuit Breaker State** panel open → half-open → close
4. **Error Rate** panel spikes then recovers
5. **P99 Latency** rises under load

### Trace a request end-to-end in Zipkin:
1. Make a payment request
2. Copy the `traceId` from the JSON log output
3. Open http://localhost:9411 and search by trace ID

## Run Tests
```bash
cd payment-api && mvn test
cd notification-service && mvn test
cd audit-service && mvn test
```

## Deploy to Minikube

```bash
# Start Minikube
minikube start --driver=docker

# Deploy
helm upgrade --install payment-service ./helm/payment-service \
  --namespace payment-system \
  --create-namespace \
  --wait

# Check pods
kubectl get pods -n payment-system
kubectl get services -n payment-system

# Port-forward payment-api
kubectl port-forward svc/payment-api 8080:8080 -n payment-system
```

## Key Design Decisions

- **Idempotency**: Every payment requires an `idempotencyKey`. Duplicate requests return the original result without re-processing.
- **Circuit Breaker**: Resilience4j opens the circuit after 50% failure rate across a 10-call window, preventing cascade failures.
- **Structured Logging**: All logs are JSON with `traceId` and `spanId` for correlation across services.
- **Kafka Exactly-Once**: Idempotent Kafka producer configured with `acks=all` and `retries=3`.
- **Health Probes**: Kubernetes liveness and readiness probes on `/actuator/health`.

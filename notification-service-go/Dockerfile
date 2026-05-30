# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

# confluent-kafka-go needs gcc (cgo)
RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o notification-service-go .

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.19
RUN apk add --no-cache ca-certificates librdkafka

WORKDIR /app
COPY --from=builder /app/notification-service-go .

EXPOSE 9095

ENV KAFKA_BOOTSTRAP_SERVERS=payment-kafka:9092 \
    KAFKA_TOPIC=payment.events \
    KAFKA_GROUP_ID=notification-group-go \
    METRICS_ADDR=:9095

ENTRYPOINT ["./notification-service-go"]

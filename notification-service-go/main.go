package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/segmentio/kafka-go"
)

// PaymentEvent mirrors com.hsbc.notification.consumer.PaymentEvent exactly.
type PaymentEvent struct {
	PaymentID          string  `json:"paymentId"`
	IdempotencyKey     string  `json:"idempotencyKey"`
	SourceAccount      string  `json:"sourceAccount"`
	DestinationAccount string  `json:"destinationAccount"`
	Amount             float64 `json:"amount"`
	Currency           string  `json:"currency"`
	Status             string  `json:"status"`
	EventType          string  `json:"eventType"`
	EventTime          json.RawMessage `json:"eventTime"`
}

type config struct {
	bootstrapServers string
	topic            string
	groupID          string
	metricsAddr      string
}

func loadConfig() config {
	return config{
		bootstrapServers: envOr("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
		topic:            envOr("KAFKA_TOPIC", "payment.events"),
		groupID:          envOr("KAFKA_GROUP_ID", "notification-group-go"),
		metricsAddr:      envOr("METRICS_ADDR", ":9095"),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

type metrics struct {
	eventsProcessed *prometheus.CounterVec
	eventsFailed    prometheus.Counter
}

func newMetrics(reg prometheus.Registerer) *metrics {
	processed := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "notifications_go_events_processed_total",
		Help: "Payment events processed, labelled by event_type.",
	}, []string{"event_type"})

	failed := prometheus.NewCounter(prometheus.CounterOpts{
		Name: "notifications_go_events_failed_total",
		Help: "Payment events that failed processing.",
	})

	reg.MustRegister(processed, failed)
	return &metrics{eventsProcessed: processed, eventsFailed: failed}
}

type NotificationService struct {
	log *slog.Logger
}

func (n *NotificationService) ProcessEvent(event PaymentEvent) {
	switch event.EventType {
	case "PAYMENT_COMPLETED":
		n.notifyCompleted(event)
	case "PAYMENT_FAILED":
		n.notifyFailed(event)
	case "PAYMENT_REVERSED":
		n.notifyReversed(event)
	case "PAYMENT_PROCESSING":
		n.log.Info("Payment is being processed", "paymentId", event.PaymentID)
	default:
		n.log.Warn("Unknown event type", "eventType", event.EventType, "paymentId", event.PaymentID)
	}
}

func (n *NotificationService) notifyCompleted(e PaymentEvent) {
	n.log.Info("NOTIFICATION [COMPLETED]",
		"paymentId", e.PaymentID,
		"amount", e.Amount,
		"currency", e.Currency,
		"from", e.SourceAccount,
		"to", e.DestinationAccount,
	)
}

func (n *NotificationService) notifyFailed(e PaymentEvent) {
	n.log.Warn("NOTIFICATION [FAILED]",
		"paymentId", e.PaymentID,
		"sourceAccount", e.SourceAccount,
	)
}

func (n *NotificationService) notifyReversed(e PaymentEvent) {
	n.log.Info("NOTIFICATION [REVERSED]",
		"paymentId", e.PaymentID,
		"amount", e.Amount,
		"currency", e.Currency,
	)
}

type Consumer struct {
	reader  *kafka.Reader
	svc     *NotificationService
	metrics *metrics
	log     *slog.Logger
}

func newConsumer(cfg config, svc *NotificationService, m *metrics, log *slog.Logger) *Consumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{cfg.bootstrapServers},
		Topic:          cfg.topic,
		GroupID:        cfg.groupID,
		MinBytes:       1,
		MaxBytes:       10e6,
		CommitInterval: 0, // manual commit
		StartOffset:    kafka.FirstOffset,
		MaxWait:        200 * time.Millisecond,
	})
	return &Consumer{reader: reader, svc: svc, metrics: m, log: log}
}

func (c *Consumer) Run(ctx context.Context) {
	c.log.Info("Consumer started, waiting for events…")
	defer c.reader.Close()

	for {
		msg, err := c.reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				c.log.Info("Shutdown signal received, closing consumer")
				return
			}
			c.log.Error("FetchMessage error", "err", err)
			continue
		}

		c.handleMessage(ctx, msg)
	}
}

func (c *Consumer) handleMessage(ctx context.Context, msg kafka.Message) {
	var event PaymentEvent
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		c.log.Error("Failed to deserialise event",
			"topic", msg.Topic, "partition", msg.Partition, "offset", msg.Offset,
			"err", err,
		)
		c.metrics.eventsFailed.Inc()
		c.reader.CommitMessages(ctx, msg)
		return
	}

	c.log.Info("Received event",
		"paymentId", event.PaymentID,
		"eventType", event.EventType,
		"status", event.Status,
		"topic", msg.Topic,
		"partition", msg.Partition,
		"offset", msg.Offset,
	)

	func() {
		defer func() {
			if r := recover(); r != nil {
				c.metrics.eventsFailed.Inc()
				c.log.Error("Panic while processing event", "paymentId", event.PaymentID, "panic", r)
			}
		}()
		c.svc.ProcessEvent(event)
		c.metrics.eventsProcessed.With(prometheus.Labels{"event_type": event.EventType}).Inc()
	}()

	if err := c.reader.CommitMessages(ctx, msg); err != nil {
		c.log.Error("Failed to commit offset", "err", err)
	}
}

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	cfg := loadConfig()

	log.Info("Starting notification-service-go",
		"bootstrapServers", cfg.bootstrapServers,
		"topic", cfg.topic,
		"groupId", cfg.groupID,
	)

	reg := prometheus.NewRegistry()
	m := newMetrics(reg)

	svc := &NotificationService{log: log}
	consumer := newConsumer(cfg, svc, m, log)

	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"UP"}`))
	})
	server := &http.Server{Addr: cfg.metricsAddr, Handler: mux}

	go func() {
		log.Info("Metrics server listening", "addr", cfg.metricsAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("Metrics server error", "err", err)
		}
	}()

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	consumer.Run(ctx)

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	server.Shutdown(shutdownCtx)

	log.Info("notification-service-go stopped cleanly")
}

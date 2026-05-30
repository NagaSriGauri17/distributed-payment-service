package com.hsbc.notification.consumer;

import com.hsbc.notification.service.NotificationService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventConsumer {

    private final NotificationService notificationService;
    private final MeterRegistry meterRegistry;
    private Counter eventsProcessedCounter;
    private Counter eventsFailedCounter;

    @PostConstruct
    public void initMetrics() {
        eventsProcessedCounter = Counter.builder("notifications.events.processed")
                .description("Total payment events processed")
                .register(meterRegistry);
        eventsFailedCounter = Counter.builder("notifications.events.failed")
                .description("Total payment events failed")
                .register(meterRegistry);
    }

    @KafkaListener(topics = "${payment.kafka.topic}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(@Payload PaymentEvent event,
                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        @Header(KafkaHeaders.OFFSET) long offset) {
        log.info("Received event paymentId={} eventType={} status={} topic={} partition={} offset={}",
                event.getPaymentId(), event.getEventType(), event.getStatus(), topic, partition, offset);
        try {
            notificationService.processEvent(event);
            eventsProcessedCounter.increment();
        } catch (Exception e) {
            eventsFailedCounter.increment();
            log.error("Failed to process event paymentId={} error={}", event.getPaymentId(), e.getMessage());
        }
    }
}

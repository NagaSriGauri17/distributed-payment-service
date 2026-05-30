package com.hsbc.payment.kafka;

import com.hsbc.payment.dto.PaymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventProducer {

    private final KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    @Value("${payment.kafka.topic}")
    private String topic;

    public void sendPaymentEvent(PaymentEvent event) {
        CompletableFuture<SendResult<String, PaymentEvent>> future =
                kafkaTemplate.send(topic, event.getPaymentId(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send payment event for paymentId={} error={}",
                        event.getPaymentId(), ex.getMessage());
            } else {
                log.info("Payment event sent paymentId={} status={} offset={}",
                        event.getPaymentId(), event.getStatus(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}

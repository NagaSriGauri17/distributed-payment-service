package com.hsbc.notification.service;

import com.hsbc.notification.consumer.PaymentEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    public void processEvent(PaymentEvent event) {
        switch (event.getEventType()) {
            case "PAYMENT_COMPLETED" -> notifyCompleted(event);
            case "PAYMENT_FAILED" -> notifyFailed(event);
            case "PAYMENT_REVERSED" -> notifyReversed(event);
            case "PAYMENT_PROCESSING" -> log.info("Payment is being processed paymentId={}", event.getPaymentId());
            default -> log.warn("Unknown event type={} paymentId={}", event.getEventType(), event.getPaymentId());
        }
    }

    private void notifyCompleted(PaymentEvent event) {
        // In real system: send email/SMS via provider
        log.info("NOTIFICATION [COMPLETED] paymentId={} amount={} {} from={} to={}",
                event.getPaymentId(), event.getAmount(), event.getCurrency(),
                event.getSourceAccount(), event.getDestinationAccount());
    }

    private void notifyFailed(PaymentEvent event) {
        log.warn("NOTIFICATION [FAILED] paymentId={} sourceAccount={}",
                event.getPaymentId(), event.getSourceAccount());
    }

    private void notifyReversed(PaymentEvent event) {
        log.info("NOTIFICATION [REVERSED] paymentId={} amount={} {}",
                event.getPaymentId(), event.getAmount(), event.getCurrency());
    }
}

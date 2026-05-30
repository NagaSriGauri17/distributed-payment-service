package com.hsbc.notification.consumer;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentEvent {
    private String paymentId;
    private String idempotencyKey;
    private String sourceAccount;
    private String destinationAccount;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String eventType;
    private LocalDateTime eventTime;
}

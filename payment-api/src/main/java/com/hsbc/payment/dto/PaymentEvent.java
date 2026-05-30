package com.hsbc.payment.dto;

import com.hsbc.payment.model.PaymentStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder
public class PaymentEvent {
    private String paymentId;
    private String idempotencyKey;
    private String sourceAccount;
    private String destinationAccount;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String eventType;
    private LocalDateTime eventTime;
}

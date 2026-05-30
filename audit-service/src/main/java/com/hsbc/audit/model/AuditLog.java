package com.hsbc.audit.model;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class AuditLog {
    private String auditId;
    private String paymentId;
    private String fromStatus;
    private String toStatus;
    private String eventType;
    private String sourceAccount;
    private String destinationAccount;
    private String amount;
    private String currency;
    private LocalDateTime timestamp;
    private String correlationId;
}

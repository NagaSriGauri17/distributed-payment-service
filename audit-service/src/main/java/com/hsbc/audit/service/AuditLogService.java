package com.hsbc.audit.service;

import com.hsbc.audit.model.AuditLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class AuditLogService {

    // In-memory store (in production: use PostgreSQL or Elasticsearch)
    private final List<AuditLog> auditLogs = new CopyOnWriteArrayList<>();

    public AuditLog logTransition(AuditLog auditLog) {
        String auditId = UUID.randomUUID().toString();
        AuditLog saved = AuditLog.builder()
                .auditId(auditId)
                .paymentId(auditLog.getPaymentId())
                .fromStatus(auditLog.getFromStatus())
                .toStatus(auditLog.getToStatus())
                .eventType(auditLog.getEventType())
                .sourceAccount(auditLog.getSourceAccount())
                .destinationAccount(auditLog.getDestinationAccount())
                .amount(auditLog.getAmount())
                .currency(auditLog.getCurrency())
                .timestamp(auditLog.getTimestamp())
                .correlationId(auditLog.getCorrelationId())
                .build();

        auditLogs.add(saved);
        log.info("Audit log saved auditId={} paymentId={} transition={}->{} correlationId={}",
                auditId, auditLog.getPaymentId(),
                auditLog.getFromStatus(), auditLog.getToStatus(),
                auditLog.getCorrelationId());
        return saved;
    }

    public List<AuditLog> getLogsByPaymentId(String paymentId) {
        return auditLogs.stream()
                .filter(log -> paymentId.equals(log.getPaymentId()))
                .toList();
    }

    public List<AuditLog> getAllLogs() {
        return new ArrayList<>(auditLogs);
    }
}

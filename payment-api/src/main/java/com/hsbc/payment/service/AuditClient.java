package com.hsbc.payment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AuditClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${audit.service.url:http://localhost:8082}")
    private String auditServiceUrl;

    public void logTransition(String paymentId, String fromStatus, String toStatus,
                               String eventType, String sourceAccount, String destinationAccount,
                               String amount, String currency, String correlationId) {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("paymentId", paymentId);
            body.put("fromStatus", fromStatus);
            body.put("toStatus", toStatus);
            body.put("eventType", eventType);
            body.put("sourceAccount", sourceAccount);
            body.put("destinationAccount", destinationAccount);
            body.put("amount", amount);
            body.put("currency", currency);
            body.put("correlationId", correlationId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            restTemplate.postForEntity(auditServiceUrl + "/api/v1/audit/log", request, Object.class);
            log.info("Audit log sent paymentId={} transition={}->{}",  paymentId, fromStatus, toStatus);
        } catch (Exception e) {
            // Non-blocking — audit failure should never fail a payment
            log.warn("Failed to send audit log paymentId={} error={}", paymentId, e.getMessage());
        }
    }
}

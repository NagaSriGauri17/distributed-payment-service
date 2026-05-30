package com.hsbc.audit.config;

import com.hsbc.audit.grpc.AuditGrpcService;
import com.hsbc.audit.model.AuditLog;
import com.hsbc.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditGrpcService auditGrpcService;
    private final AuditLogService auditLogService;

    @PostMapping("/log")
    public ResponseEntity<AuditLog> logTransition(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(auditGrpcService.logStateTransition(request));
    }

    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<List<AuditLog>> getByPayment(@PathVariable String paymentId) {
        return ResponseEntity.ok(auditLogService.getLogsByPaymentId(paymentId));
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAll() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }
}

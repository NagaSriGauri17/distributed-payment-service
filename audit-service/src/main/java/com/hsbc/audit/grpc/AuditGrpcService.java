package com.hsbc.audit.grpc;

import com.hsbc.audit.model.AuditLog;
import com.hsbc.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * gRPC service for audit logging.
 *
 * NOTE: Full protobuf/gRPC stub generation requires the protoc plugin in the build.
 * This class shows the service logic using a simplified approach with Spring REST
 * as a fallback so the project compiles and runs without the full protobuf toolchain.
 * The REST endpoint at /api/v1/audit mirrors exactly what the gRPC endpoint would do.
 *
 * To enable real gRPC: add protoc-gen-grpc-java to pom.xml and generate stubs
 * from audit.proto, then extend GrpcService base class.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditGrpcService {

    private final AuditLogService auditLogService;

    public AuditLog logStateTransition(Map<String, String> request) {
        AuditLog log = AuditLog.builder()
                .paymentId(request.get("paymentId"))
                .fromStatus(request.getOrDefault("fromStatus", "UNKNOWN"))
                .toStatus(request.get("toStatus"))
                .eventType(request.get("eventType"))
                .sourceAccount(request.get("sourceAccount"))
                .destinationAccount(request.get("destinationAccount"))
                .amount(request.get("amount"))
                .currency(request.get("currency"))
                .correlationId(request.get("correlationId"))
                .timestamp(LocalDateTime.now())
                .build();
        return auditLogService.logTransition(log);
    }
}

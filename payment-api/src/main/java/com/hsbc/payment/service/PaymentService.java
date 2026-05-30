package com.hsbc.payment.service;

import com.hsbc.payment.dto.*;
import com.hsbc.payment.kafka.PaymentEventProducer;
import com.hsbc.payment.model.Payment;
import com.hsbc.payment.model.PaymentStatus;
import com.hsbc.payment.repository.PaymentRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventProducer eventProducer;
    private final MeterRegistry meterRegistry;
    private final AuditClient auditClient;

    private Counter paymentCreatedCounter;
    private Counter paymentFailedCounter;
    private Timer paymentProcessingTimer;

    @PostConstruct
    public void initMetrics() {
        paymentCreatedCounter = Counter.builder("payments.created.total")
                .description("Total number of payments created")
                .register(meterRegistry);
        paymentFailedCounter = Counter.builder("payments.failed.total")
                .description("Total number of failed payments")
                .register(meterRegistry);
        paymentProcessingTimer = Timer.builder("payments.processing.duration")
                .description("Payment processing duration")
                .register(meterRegistry);
    }

    @Transactional
    @CircuitBreaker(name = "paymentService", fallbackMethod = "createPaymentFallback")
    @Retry(name = "paymentService")
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        return paymentProcessingTimer.record(() -> {
            // Idempotency check
            Optional<Payment> existing = paymentRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                log.info("Idempotent request detected idempotencyKey={}", request.getIdempotencyKey());
                return toResponse(existing.get());
            }

            Payment payment = Payment.builder()
                    .idempotencyKey(request.getIdempotencyKey())
                    .sourceAccount(request.getSourceAccount())
                    .destinationAccount(request.getDestinationAccount())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .description(request.getDescription())
                    .status(PaymentStatus.PENDING)
                    .build();

            payment = paymentRepository.save(payment);
            log.info("Payment created paymentId={} status={}", payment.getId(), payment.getStatus());

            // Transition to PROCESSING
            payment.setStatus(PaymentStatus.PROCESSING);
            payment = paymentRepository.save(payment);
            auditClient.logTransition(payment.getId(), "PENDING", "PROCESSING",
                    "PAYMENT_PROCESSING", payment.getSourceAccount(), payment.getDestinationAccount(),
                    payment.getAmount().toString(), payment.getCurrency(), request.getIdempotencyKey());

            // Publish event
            eventProducer.sendPaymentEvent(toEvent(payment, "PAYMENT_PROCESSING"));

            // Simulate processing and complete
            payment.setStatus(PaymentStatus.COMPLETED);
            payment = paymentRepository.save(payment);
            auditClient.logTransition(payment.getId(), "PROCESSING", "COMPLETED",
                    "PAYMENT_COMPLETED", payment.getSourceAccount(), payment.getDestinationAccount(),
                    payment.getAmount().toString(), payment.getCurrency(), request.getIdempotencyKey());
            eventProducer.sendPaymentEvent(toEvent(payment, "PAYMENT_COMPLETED"));

            paymentCreatedCounter.increment();
            log.info("Payment completed paymentId={}", payment.getId());
            return toResponse(payment);
        });
    }

    public PaymentResponse createPaymentFallback(CreatePaymentRequest request, Exception ex) {
        log.error("Circuit breaker open for payment creation idempotencyKey={} error={}",
                request.getIdempotencyKey(), ex.getMessage());
        paymentFailedCounter.increment();
        throw new RuntimeException("Payment service temporarily unavailable. Please retry later.", ex);
    }

    @Transactional(readOnly = true)
    public Optional<PaymentResponse> getPaymentById(String id) {
        return paymentRepository.findById(id).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByAccount(String accountId) {
        return paymentRepository.findBySourceAccount(accountId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public Optional<PaymentResponse> reversePayment(String id) {
        return paymentRepository.findById(id).map(payment -> {
            if (payment.getStatus() != PaymentStatus.COMPLETED) {
                throw new IllegalStateException("Only COMPLETED payments can be reversed");
            }
            payment.setStatus(PaymentStatus.REVERSED);
            payment = paymentRepository.save(payment);
            auditClient.logTransition(payment.getId(), "COMPLETED", "REVERSED",
                    "PAYMENT_REVERSED", payment.getSourceAccount(), payment.getDestinationAccount(),
                    payment.getAmount().toString(), payment.getCurrency(), id);
            eventProducer.sendPaymentEvent(toEvent(payment, "PAYMENT_REVERSED"));
            log.info("Payment reversed paymentId={}", payment.getId());
            return toResponse(payment);
        });
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .idempotencyKey(p.getIdempotencyKey())
                .sourceAccount(p.getSourceAccount())
                .destinationAccount(p.getDestinationAccount())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus())
                .description(p.getDescription())
                .failureReason(p.getFailureReason())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private PaymentEvent toEvent(Payment p, String eventType) {
        return PaymentEvent.builder()
                .paymentId(p.getId())
                .idempotencyKey(p.getIdempotencyKey())
                .sourceAccount(p.getSourceAccount())
                .destinationAccount(p.getDestinationAccount())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus())
                .eventType(eventType)
                .eventTime(LocalDateTime.now())
                .build();
    }
}

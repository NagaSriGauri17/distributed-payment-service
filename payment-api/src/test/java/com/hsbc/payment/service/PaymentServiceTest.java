package com.hsbc.payment.service;

import com.hsbc.payment.dto.CreatePaymentRequest;
import com.hsbc.payment.dto.PaymentResponse;
import com.hsbc.payment.kafka.PaymentEventProducer;
import com.hsbc.payment.model.Payment;
import com.hsbc.payment.model.PaymentStatus;
import com.hsbc.payment.repository.PaymentRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentEventProducer eventProducer;

    @Mock
    private AuditClient auditClient;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, eventProducer, new SimpleMeterRegistry(), auditClient);
        paymentService.initMetrics();
    }

    @Test
    void createPayment_success() {
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setIdempotencyKey("key-001");
        request.setSourceAccount("ACC-001");
        request.setDestinationAccount("ACC-002");
        request.setAmount(new BigDecimal("100.00"));
        request.setCurrency("GBP");

        Payment saved = Payment.builder()
                .id("pay-001")
                .idempotencyKey("key-001")
                .sourceAccount("ACC-001")
                .destinationAccount("ACC-002")
                .amount(new BigDecimal("100.00"))
                .currency("GBP")
                .status(PaymentStatus.COMPLETED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(paymentRepository.findByIdempotencyKey("key-001")).thenReturn(Optional.empty());
        when(paymentRepository.save(any())).thenReturn(saved);

        PaymentResponse response = paymentService.createPayment(request);

        assertThat(response.getId()).isEqualTo("pay-001");
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        verify(eventProducer, atLeastOnce()).sendPaymentEvent(any());
    }

    @Test
    void createPayment_idempotent_returnsSavedPayment() {
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setIdempotencyKey("key-dupe");
        request.setSourceAccount("ACC-001");
        request.setDestinationAccount("ACC-002");
        request.setAmount(new BigDecimal("50.00"));
        request.setCurrency("USD");

        Payment existing = Payment.builder()
                .id("pay-existing")
                .idempotencyKey("key-dupe")
                .status(PaymentStatus.COMPLETED)
                .amount(new BigDecimal("50.00"))
                .currency("USD")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(paymentRepository.findByIdempotencyKey("key-dupe")).thenReturn(Optional.of(existing));

        PaymentResponse response = paymentService.createPayment(request);

        assertThat(response.getId()).isEqualTo("pay-existing");
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void getPaymentById_notFound_returnsEmpty() {
        when(paymentRepository.findById("missing")).thenReturn(Optional.empty());
        assertThat(paymentService.getPaymentById("missing")).isEmpty();
    }
}

package com.hsbc.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hsbc.payment.dto.CreatePaymentRequest;
import com.hsbc.payment.dto.PaymentResponse;
import com.hsbc.payment.model.PaymentStatus;
import com.hsbc.payment.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentController.class)
class PaymentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean PaymentService paymentService;

    @Test
    void createPayment_returns201() throws Exception {
        CreatePaymentRequest req = new CreatePaymentRequest();
        req.setIdempotencyKey("key-001");
        req.setSourceAccount("ACC-001");
        req.setDestinationAccount("ACC-002");
        req.setAmount(new BigDecimal("250.00"));
        req.setCurrency("GBP");

        PaymentResponse resp = PaymentResponse.builder()
                .id("pay-001").idempotencyKey("key-001")
                .status(PaymentStatus.COMPLETED)
                .amount(new BigDecimal("250.00")).currency("GBP")
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        when(paymentService.createPayment(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("pay-001"))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void getPayment_notFound_returns404() throws Exception {
        when(paymentService.getPaymentById("missing")).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/v1/payments/missing"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createPayment_invalidRequest_returns400() throws Exception {
        CreatePaymentRequest req = new CreatePaymentRequest(); // missing required fields
        mockMvc.perform(post("/api/v1/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}

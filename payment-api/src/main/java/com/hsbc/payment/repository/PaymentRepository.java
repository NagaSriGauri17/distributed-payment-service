package com.hsbc.payment.repository;

import com.hsbc.payment.model.Payment;
import com.hsbc.payment.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    List<Payment> findBySourceAccount(String sourceAccount);
    List<Payment> findByStatus(PaymentStatus status);
}

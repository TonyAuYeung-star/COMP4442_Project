package com.comp4442.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.comp4442.model.entity.Payment;
import com.comp4442.model.entity.PaymentStatus;

/**
 * Repository for Payment entity
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBookingId(Long bookingId);

    Optional<Payment> findByBookingIdAndStatus(Long bookingId, PaymentStatus status);

    Optional<Payment> findByPaymentReferenceId(String paymentReferenceId);
}

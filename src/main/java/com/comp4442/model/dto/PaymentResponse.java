package com.comp4442.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.comp4442.model.entity.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload for payment processing result.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long paymentId;
    private Long bookingId;
    private String paymentReferenceId;
    private PaymentStatus status;
    private String message;
    private BigDecimal amount;
    private LocalDateTime processedAt;
}

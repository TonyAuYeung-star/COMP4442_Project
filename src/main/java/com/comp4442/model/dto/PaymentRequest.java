package com.comp4442.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for processing a payment.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {
    private Long bookingId;
    private String cardNumber;
    private String expiryMonth;
    private String expiryYear;
    private String cvv;
}

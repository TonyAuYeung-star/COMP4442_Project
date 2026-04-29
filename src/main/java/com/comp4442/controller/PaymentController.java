package com.comp4442.controller;

import com.comp4442.model.dto.ApiResponse;
import com.comp4442.model.dto.PaymentRequest;
import com.comp4442.model.dto.PaymentResponse;
import com.comp4442.service.MockPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Payment Controller - handles payment processing operations.
 */
@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class PaymentController {

    private final MockPaymentService paymentService;

    /**
     * Process payment request
     * POST /api/v1/payments/process
     */
    @PostMapping("/process")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(@RequestBody PaymentRequest request) {
        log.info("Processing payment for booking: {}", request.getBookingId());
        try {
            PaymentResponse result = paymentService.processPayment(request);
            return ResponseEntity.ok(ApiResponse.success("Payment processed", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }
}

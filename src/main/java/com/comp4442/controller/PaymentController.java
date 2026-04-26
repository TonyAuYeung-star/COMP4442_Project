package com.comp4442.controller;

import com.comp4442.model.dto.ApiResponse;
import com.comp4442.model.dto.PaymentDTO;
import com.comp4442.service.PaymentService;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Payment Controller - handles Stripe payment operations
 */
@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Create a Stripe PaymentIntent for a booking
     * POST /api/v1/payments/stripe/intent
     */
    @PostMapping("/stripe/intent")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPaymentIntent(
            @RequestBody Map<String, Long> request) {
        Long bookingId = request.get("bookingId");
        log.info("Creating payment intent for booking: {}", bookingId);

        if (bookingId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, "bookingId is required"));
        }

        try {
            Map<String, String> result = paymentService.createPaymentIntent(bookingId);
            return ResponseEntity.ok(ApiResponse.success("Payment intent created", result));
        } catch (StripeException e) {
            log.error("Stripe error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, "Payment processing error: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Confirm a Stripe payment
     * POST /api/v1/payments/stripe/confirm
     */
    @PostMapping("/stripe/confirm")
    public ResponseEntity<ApiResponse<PaymentDTO>> confirmPayment(
            @RequestBody Map<String, String> request) {
        String paymentIntentId = request.get("paymentIntentId");
        log.info("Confirming payment: {}", paymentIntentId);

        if (paymentIntentId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, "paymentIntentId is required"));
        }

        try {
            PaymentDTO result = paymentService.confirmPayment(paymentIntentId);
            return ResponseEntity.ok(ApiResponse.success("Payment confirmed", result));
        } catch (StripeException e) {
            log.error("Stripe error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, "Payment confirmation error: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Get payment by booking ID
     * GET /api/v1/payments/booking/{bookingId}
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentDTO>> getPaymentByBookingId(
            @PathVariable Long bookingId) {
        log.info("Fetching payment for booking: {}", bookingId);
        try {
            PaymentDTO result = paymentService.getPaymentByBookingId(bookingId);
            return ResponseEntity.ok(ApiResponse.success("Payment retrieved", result));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(404, e.getMessage()));
        }
    }
}

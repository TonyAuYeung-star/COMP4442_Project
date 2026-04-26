package com.comp4442.service;

import com.comp4442.exception.ResourceNotFoundException;
import com.comp4442.model.dto.PaymentDTO;
import com.comp4442.model.entity.Booking;
import com.comp4442.model.entity.Payment;
import com.comp4442.model.entity.PaymentStatus;
import com.comp4442.repository.BookingRepository;
import com.comp4442.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Payment Service - handles Stripe PaymentIntent creation and confirmation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @PostConstruct
    public void init() {
        if (stripeSecretKey != null && !stripeSecretKey.isEmpty()) {
            Stripe.apiKey = stripeSecretKey;
        }
    }

    @Transactional
    public Map<String, String> createPaymentIntent(Long bookingId) throws StripeException {
        log.info("Creating payment intent for booking {}", bookingId);

        if (stripeSecretKey == null || stripeSecretKey.isEmpty()) {
            throw new IllegalStateException("Stripe secret key is not configured");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        // Amount in cents for Stripe
        long amountInCents = booking.getTotalPrice().multiply(BigDecimal.valueOf(100)).longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("usd")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .putMetadata("bookingId", String.valueOf(bookingId))
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        // Create payment record
        Payment payment = Payment.builder()
                .booking(booking)
                .stripeIntentId(intent.getId())
                .amount(booking.getTotalPrice())
                .status(PaymentStatus.PENDING)
                .build();

        paymentRepository.save(payment);
        log.info("Payment intent created: {}", intent.getId());

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());
        response.put("paymentIntentId", intent.getId());
        return response;
    }

    @Transactional
    public PaymentDTO confirmPayment(String paymentIntentId) throws StripeException {
        log.info("Confirming payment: {}", paymentIntentId);

        Payment payment = paymentRepository.findByStripeIntentId(paymentIntentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (stripeSecretKey != null && !stripeSecretKey.isEmpty()) {
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
            if ("succeeded".equals(intent.getStatus())) {
                payment.setStatus(PaymentStatus.SUCCEEDED);
            } else if ("requires_payment_method".equals(intent.getStatus())) {
                payment.setStatus(PaymentStatus.FAILED);
            }
        } else {
            // For development without Stripe key
            payment.setStatus(PaymentStatus.SUCCEEDED);
        }

        Payment saved = paymentRepository.save(payment);
        log.info("Payment confirmed with status: {}", saved.getStatus());

        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public PaymentDTO getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for booking"));
        return convertToDTO(payment);
    }

    private PaymentDTO convertToDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking().getId())
                .stripeIntentId(payment.getStripeIntentId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}

package com.comp4442.service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.comp4442.exception.ResourceNotFoundException;
import com.comp4442.model.dto.PaymentRequest;
import com.comp4442.model.dto.PaymentResponse;
import com.comp4442.model.entity.Booking;
import com.comp4442.model.entity.BookingStatus;
import com.comp4442.model.entity.Payment;
import com.comp4442.model.entity.PaymentStatus;
import com.comp4442.repository.BookingRepository;
import com.comp4442.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Payment simulation service for demo use without external providers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MockPaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        if (request.getBookingId() == null) {
            throw new IllegalArgumentException("bookingId is required");
        }
        if (isBlank(request.getCardNumber()) || isBlank(request.getExpiryMonth())
                || isBlank(request.getExpiryYear()) || isBlank(request.getCvv())) {
            throw new IllegalArgumentException("cardNumber, expiryMonth, expiryYear and cvv are required");
        }

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("Only PENDING_PAYMENT bookings can be paid");
        }
        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(LocalDateTime.now())) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);
            throw new IllegalArgumentException("Payment window expired for this booking");
        }

        String normalizedCard = request.getCardNumber().replaceAll("\\s+", "");
        Payment payment = paymentRepository.findByBookingId(booking.getId()).orElseGet(() ->
                Payment.builder()
                        .booking(booking)
                        .amount(booking.getTotalPrice())
                        .build());

        payment.setAmount(booking.getTotalPrice());
        payment.setPaymentReferenceId(generatePaymentReference());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setFailureReason(null);
        payment.setUpdatedAt(LocalDateTime.now());

        String failureReason = validatePayment(normalizedCard, request.getExpiryMonth(), request.getExpiryYear(), request.getCvv());
        if (failureReason == null) {
            payment.setStatus(PaymentStatus.SUCCESS);
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setExpiresAt(null);
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(failureReason);
        }

        Payment saved = paymentRepository.save(payment);
        log.info("Processed payment {} with status {}", saved.getPaymentReferenceId(), saved.getStatus());

        return PaymentResponse.builder()
                .paymentId(saved.getId())
                .bookingId(saved.getBooking().getId())
                .paymentReferenceId(saved.getPaymentReferenceId())
                .status(saved.getStatus())
                .message(saved.getStatus() == PaymentStatus.SUCCESS ? "Payment successful" : saved.getFailureReason())
                .amount(saved.getAmount())
                .processedAt(saved.getUpdatedAt())
                .build();
    }

    private String validatePayment(String cardNumber, String monthText, String yearText, String cvv) {
        if (!cardNumber.matches("\\d{13,19}")) {
            return "Invalid card number format";
        }

        if (cvv == null || !cvv.matches("\\d{3}")) {
            return "Invalid CVV format";
        }

        if ("0000000000000000".equals(cardNumber)) {
            return "Card was declined";
        }
        if ("1234567890123456".equals(cardNumber)) {
            return "Insufficient funds";
        }

        if (!isValidLuhn(cardNumber)) {
            return "Invalid card number";
        }

        if (monthText == null || !monthText.matches("\\d{1,2}")) {
            return "Invalid expiry month";
        }
        if (yearText == null || !yearText.matches("\\d{4}")) {
            return "Invalid expiry year";
        }

        int month = Integer.parseInt(monthText);
        int year = Integer.parseInt(yearText);

        if (month < 1 || month > 12) {
            return "Invalid expiry month";
        }
        if (year <= 2026) {
            return "Invalid expiry year";
        }

        YearMonth expiry = YearMonth.of(year, month);
        if (expiry.isBefore(YearMonth.now())) {
            return "Card has expired";
        }

        return null;
    }

    // Starting from the rightmost digit, double every second digit.
    private boolean isValidLuhn(String cardNumber) {
        int sum = 0;
        boolean isSecond = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int digit = cardNumber.charAt(i) - '0';
            if (isSecond) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            isSecond = !isSecond;
        }
        return sum % 10 == 0;
    }

    private String generatePaymentReference() {
        return "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}

package com.comp4442.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.comp4442.model.entity.Booking;
import com.comp4442.model.entity.BookingStatus;
import com.comp4442.repository.BookingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Expires unpaid pending bookings after 3 minutes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingExpiryService {

    private static final long PENDING_EXPIRY_MINUTES = 1L;
    private final BookingRepository bookingRepository;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void expirePendingBookings() {
        LocalDateTime cutoff = LocalDateTime.now();
        List<Booking> expired = bookingRepository.findByStatusAndExpiresAtBefore(BookingStatus.PENDING_PAYMENT, cutoff);

        if (expired.isEmpty()) {
            return;
        }

        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.setUpdatedAt(LocalDateTime.now());
            booking.setExpiresAt(null);
        }

        bookingRepository.saveAll(expired);
        log.info("Expired {} pending payment bookings older than {} minutes", expired.size(), PENDING_EXPIRY_MINUTES);
    }
}

package com.comp4442.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.comp4442.exception.ResourceNotFoundException;
import com.comp4442.exception.RoomNotAvailableException;
import com.comp4442.exception.UnauthorizedException;
import com.comp4442.model.dto.BookingCreateRequest;
import com.comp4442.model.dto.BookingDTO;
import com.comp4442.model.dto.BookingOverviewDTO;
import com.comp4442.model.entity.Booking;
import com.comp4442.model.entity.BookingStatus;
import com.comp4442.model.entity.CancellationSource;
import com.comp4442.model.entity.PaymentStatus;
import com.comp4442.model.entity.Room;
import com.comp4442.model.entity.User;
import com.comp4442.repository.BookingRepository;
import com.comp4442.repository.PaymentRepository;
import com.comp4442.repository.RoomRepository;
import com.comp4442.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Booking Service - handles booking creation, cancellation, and history
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {
    private static final int MAX_PAY_LATER_ATTEMPTS = 3;

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public synchronized BookingDTO createBooking(Long userId, BookingCreateRequest request) {
        log.info("Creating booking for user {} and room {}", userId, request.getRoomId());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        if (!room.getIsAvailable()) {
            throw new RoomNotAvailableException("Room is not available for booking");
        }

        // Check for conflicting bookings - critical synchronized + transactional logic
        int conflicts = bookingRepository.countConflicting(
                request.getRoomId(), request.getCheckIn(), request.getCheckOut());

        if (conflicts > 0) {
            throw new RoomNotAvailableException("Room is already booked for the selected dates");
        }

        // Calculate total price
        long nights = ChronoUnit.DAYS.between(request.getCheckIn(), request.getCheckOut());
        BigDecimal totalPrice = room.getPricePerNight().multiply(BigDecimal.valueOf(nights));

        Booking booking = Booking.builder()
                .user(user)
                .room(room)
                .checkIn(request.getCheckIn())
                .checkOut(request.getCheckOut())
                .totalPrice(totalPrice)
                .status(BookingStatus.PENDING_PAYMENT)
                .expiresAt(LocalDateTime.now().plusMinutes(1))
                .payLaterCount(0)
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created successfully: {}", saved.getId());

        return convertToDTO(saved);
    }

    @Transactional
    public List<BookingDTO> getUserBookingHistory(Long userId) {
        expirePendingPaymentBookings();
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<BookingDTO> getAllBookings() {
        expirePendingPaymentBookings();
        return bookingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDTO cancelBooking(Long userId, Long bookingId) {
        log.info("Cancelling booking {} by user {}", bookingId, userId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationSource(CancellationSource.USER);
        Booking saved = bookingRepository.save(booking);
        log.info("Booking cancelled successfully: {}", saved.getId());

        return convertToDTO(saved);
    }

    @Transactional
    public BookingDTO payLater(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only update your own bookings");
        }
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("Only pending payment bookings can be marked as pay later");
        }
        int currentPayLaterCount = booking.getPayLaterCount() == null ? 0 : booking.getPayLaterCount();
        if (currentPayLaterCount >= MAX_PAY_LATER_ATTEMPTS) {
            throw new IllegalArgumentException("Pay later limit reached (maximum 3 times). Please complete payment now.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (booking.getExpiresAt() != null && !booking.getExpiresAt().isAfter(now)) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.setExpiresAt(null);
            booking.setUpdatedAt(now);
            bookingRepository.save(booking);
            throw new IllegalArgumentException("Booking payment window has already expired");
        }

        booking.setPayLaterCount(currentPayLaterCount + 1);
        booking.setExpiresAt(now.plusMinutes(1));
        booking.setUpdatedAt(now);
        Booking saved = bookingRepository.save(booking);
        return convertToDTO(saved);
    }

    @Transactional
    public BookingDTO adminCancelBooking(Long bookingId) {
        log.info("Admin cancelling booking {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationSource(CancellationSource.ADMINISTRATOR);
        Booking saved = bookingRepository.save(booking);
        log.info("Admin cancelled booking successfully: {}", saved.getId());

        return convertToDTO(saved);
    }

    @Transactional
    public BookingDTO adminUpdateBooking(Long bookingId, LocalDate checkIn, LocalDate checkOut, BigDecimal totalPrice) {
        log.info("Admin updating booking {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (checkIn != null) booking.setCheckIn(checkIn);
        if (checkOut != null) booking.setCheckOut(checkOut);
        if (totalPrice != null) booking.setTotalPrice(totalPrice);
        
        booking.setUpdatedAt(java.time.LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);
        log.info("Admin updated booking successfully: {}", saved.getId());

        return convertToDTO(saved);
    }

    private BookingDTO convertToDTO(Booking booking) {
        String paymentRefId = paymentRepository.findByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)
                .map(payment -> payment.getPaymentReferenceId())
                .orElseGet(() -> paymentRepository.findByBookingId(booking.getId())
                        .map(payment -> payment.getPaymentReferenceId())
                        .orElse(null));

        return BookingDTO.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .username(booking.getUser().getUsername())
                .roomId(booking.getRoom().getId())
                .roomName(booking.getRoom().getName())
                .checkIn(booking.getCheckIn())
                .checkOut(booking.getCheckOut())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus())
                .cancellationSource(booking.getCancellationSource())
                .expiresAt(booking.getExpiresAt())
                .payLaterCount(booking.getPayLaterCount() == null ? 0 : booking.getPayLaterCount())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .paymentReferenceId(paymentRefId)
                .build();
    }

    @Transactional
    protected void expirePendingPaymentBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expired = bookingRepository.findByStatusAndExpiresAtBefore(BookingStatus.PENDING_PAYMENT, now);
        if (expired.isEmpty()) {
            return;
        }
        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.setExpiresAt(null);
            booking.setUpdatedAt(now);
        }
        bookingRepository.saveAll(expired);
    }

    @Transactional
    public BookingOverviewDTO getSystemBookingOverview() {
        expirePendingPaymentBookings();
        long confirmedBookingCount = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long pendingBookingCount = bookingRepository.countByStatus(BookingStatus.PENDING_PAYMENT);
        BigDecimal confirmedRevenue = bookingRepository.sumTotalPriceByConfirmedStatus();

        return BookingOverviewDTO.builder()
                .confirmedBookingCount(confirmedBookingCount)
                .pendingBookingCount(pendingBookingCount)
                .confirmedRevenue(confirmedRevenue)
                .build();
    }
}

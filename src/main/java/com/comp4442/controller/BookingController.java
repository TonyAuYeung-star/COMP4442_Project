package com.comp4442.controller;

import com.comp4442.model.dto.ApiResponse;
import com.comp4442.model.dto.BookingCreateRequest;
import com.comp4442.model.dto.BookingDTO;
import com.comp4442.service.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Booking Controller - handles booking creation, history, and cancellation
 */
@RestController
@RequestMapping("/v1/bookings")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class BookingController {

    private final BookingService bookingService;

    /**
     * Create a new booking
     * POST /api/v1/bookings/create
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<BookingDTO>> createBooking(
            @RequestBody BookingCreateRequest request,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        log.info("Creating booking for user: {}", userId);

        try {
            BookingDTO result = bookingService.createBooking(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Booking created successfully", result));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Get user booking history
     * GET /api/v1/bookings/history
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getBookingHistory(
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        log.info("Fetching booking history for user: {}", userId);

        List<BookingDTO> bookings = bookingService.getUserBookingHistory(userId);
        return ResponseEntity.ok(ApiResponse.success("Booking history retrieved", bookings));
    }

    /**
     * Cancel a booking
     * POST /api/v1/bookings/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingDTO>> cancelBooking(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        log.info("Cancelling booking {} by user {}", id, userId);

        try {
            BookingDTO result = bookingService.cancelBooking(userId, id);
            return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", result));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }
}

package com.comp4442.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.comp4442.model.dto.ApiResponse;
import com.comp4442.model.dto.BookingDTO;
import com.comp4442.model.dto.RoomDTO;
import com.comp4442.service.BookingService;
import com.comp4442.service.RoomService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Admin Controller - handles admin-only operations
 */
@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private final RoomService roomService;
    private final BookingService bookingService;

    // Room Management

    /**
     * Create a new room
     * POST /api/v1/admin/rooms
     */
    @PostMapping("/rooms")
    public ResponseEntity<ApiResponse<RoomDTO>> createRoom(@RequestBody RoomDTO request) {
        log.info("Admin creating new room: {}", request.getName());
        try {
            RoomDTO created = roomService.createRoom(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Room created successfully", created));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Update a room
     * PUT /api/v1/admin/rooms/{id}
     */
    @PutMapping("/rooms/{id}")
    public ResponseEntity<ApiResponse<RoomDTO>> updateRoom(
            @PathVariable Long id,
            @RequestBody RoomDTO request) {
        log.info("Admin updating room: {}", id);
        try {
            RoomDTO updated = roomService.updateRoom(id, request);
            return ResponseEntity.ok(ApiResponse.success("Room updated", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Delete a room
     * DELETE /api/v1/admin/rooms/{id}
     */
    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        log.info("Admin deleting room: {}", id);
        try {
            roomService.deleteRoom(id);
            return ResponseEntity.ok(ApiResponse.success("Room deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    // Booking Management

    /**
     * Get all bookings
     * GET /api/v1/admin/bookings/all
     */
    @GetMapping("/bookings/all")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getAllBookings() {
        log.info("Admin fetching all bookings");
        List<BookingDTO> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(ApiResponse.success("All bookings retrieved", bookings));
    }

    /**
     * Admin cancel any booking
     * PUT /api/v1/admin/bookings/{id}/cancel
     */
    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingDTO>> cancelBooking(@PathVariable Long id) {
        log.info("Admin cancelling booking: {}", id);
        try {
            BookingDTO cancelled = bookingService.adminCancelBooking(id);
            return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", cancelled));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Admin update booking details
     * PUT /api/v1/admin/bookings/{id}
     */
    @PutMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse<BookingDTO>> updateBooking(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updateRequest) {
        log.info("Admin updating booking: {}", id);
        try {
            LocalDate checkIn = updateRequest.containsKey("checkIn") ? LocalDate.parse((String) updateRequest.get("checkIn")) : null;
            LocalDate checkOut = updateRequest.containsKey("checkOut") ? LocalDate.parse((String) updateRequest.get("checkOut")) : null;
            BigDecimal totalPrice = updateRequest.containsKey("totalPrice") ? new BigDecimal(updateRequest.get("totalPrice").toString()) : null;
            
            BookingDTO updated = bookingService.adminUpdateBooking(id, checkIn, checkOut, totalPrice);
            return ResponseEntity.ok(ApiResponse.success("Booking updated successfully", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Get ALL rooms including unavailable for admin management
     * GET /api/v1/admin/rooms
     */
    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<RoomDTO>>> getAllRoomsAdmin() {
        log.info("Admin fetching all rooms");
        List<RoomDTO> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(ApiResponse.success("All rooms retrieved", rooms));
    }
}

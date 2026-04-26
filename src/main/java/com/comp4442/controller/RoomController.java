package com.comp4442.controller;

import com.comp4442.model.dto.ApiResponse;
import com.comp4442.model.dto.AvailabilityRequest;
import com.comp4442.model.dto.RoomDTO;
import com.comp4442.model.dto.RoomSearchRequest;
import com.comp4442.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Room Controller - handles room search and availability
 */
@RestController
@RequestMapping("/v1/rooms")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class RoomController {

    private final RoomService roomService;

    /**
     * Get all available rooms
     * GET /api/v1/rooms
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomDTO>>> getAllRooms() {
        log.info("Fetching all available rooms");
        List<RoomDTO> rooms = roomService.getAllAvailableRooms();
        return ResponseEntity.ok(ApiResponse.success("Rooms retrieved successfully", rooms));
    }

    /**
     * Get room by ID
     * GET /api/v1/rooms/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomDTO>> getRoomById(@PathVariable Long id) {
        log.info("Fetching room with ID: {}", id);
        try {
            RoomDTO room = roomService.getRoomById(id);
            return ResponseEntity.ok(ApiResponse.success("Room retrieved successfully", room));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error(404, e.getMessage()));
        }
    }

    /**
     * Search rooms with filters
     * POST /api/v1/rooms/search
     */
    @PostMapping("/search")
    public ResponseEntity<ApiResponse<List<RoomDTO>>> searchRooms(@RequestBody RoomSearchRequest request) {
        log.info("Searching rooms with filters");
        List<RoomDTO> rooms = roomService.searchRooms(request);
        return ResponseEntity.ok(ApiResponse.success("Rooms searched successfully", rooms));
    }

    /**
     * Check room availability
     * POST /api/v1/rooms/availability
     */
    @PostMapping("/availability")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkAvailability(
            @RequestBody AvailabilityRequest request) {
        log.info("Checking availability for room {} from {} to {}",
                request.getRoomId(), request.getCheckIn(), request.getCheckOut());
        try {
            boolean available = roomService.checkAvailability(
                    request.getRoomId(), request.getCheckIn(), request.getCheckOut());

            Map<String, Object> data = new HashMap<>();
            data.put("available", available);
            data.put("roomId", request.getRoomId());
            data.put("checkIn", request.getCheckIn());
            data.put("checkOut", request.getCheckOut());

            if (available) {
                data.put("totalPrice", roomService.calculateTotalPrice(
                        request.getRoomId(), request.getCheckIn(), request.getCheckOut()));
            }

            return ResponseEntity.ok(ApiResponse.success("Availability checked", data));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400)
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }
}

package com.comp4442.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.comp4442.model.dto.RoomDTO;
import com.comp4442.model.dto.RoomSearchRequest;
import com.comp4442.model.entity.Room;
import com.comp4442.repository.BookingRepository;
import com.comp4442.repository.RoomRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Room Service - handles room search and availability checking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<RoomDTO> getAllAvailableRooms() {
        return roomRepository.findByIsAvailableTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoomDTO> getAllRooms() {
        return roomRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomDTO getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found with ID: " + id));
        return convertToDTO(room);
    }

    @Transactional(readOnly = true)
    public List<RoomDTO> searchRooms(RoomSearchRequest request) {
        log.info("Searching rooms with filters");

        List<Room> rooms = roomRepository.searchRooms(
                request.getType(),
                request.getCapacity(),
                request.getMinPrice(),
                request.getMaxPrice()
        );

        // If dates are provided, filter out rooms with conflicting bookings
        if (request.getCheckIn() != null && request.getCheckOut() != null) {
            rooms = rooms.stream()
                    .filter(room -> bookingRepository.countConflicting(
                            room.getId(), request.getCheckIn(), request.getCheckOut()) == 0)
                    .collect(Collectors.toList());
        }

        return rooms.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public synchronized boolean checkAvailability(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        log.info("Checking availability for room {} from {} to {}", roomId, checkIn, checkOut);

        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Invalid check-in/check-out dates");
        }

        int conflicts = bookingRepository.countConflicting(roomId, checkIn, checkOut);
        return conflicts == 0;
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateTotalPrice(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found with ID: " + roomId));

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        return room.getPricePerNight().multiply(BigDecimal.valueOf(nights));
    }

    // Admin room management methods

    @Transactional
    public RoomDTO createRoom(RoomDTO request) {
        log.info("Creating new room: {}", request.getName());

        Room room = Room.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .pricePerNight(request.getPricePerNight())
                .amenities(request.getAmenities())
                .imageUrl(request.getImageUrl())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .build();

        Room saved = roomRepository.save(room);
        log.info("Room created successfully with ID: {}", saved.getId());
        return convertToDTO(saved);
    }

    @Transactional
    public RoomDTO updateRoom(Long id, RoomDTO request) {
        log.info("Updating room: {}", id);

        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found with ID: " + id));

        room.setName(request.getName());
        room.setType(request.getType());
        room.setCapacity(request.getCapacity());
        room.setPricePerNight(request.getPricePerNight());
        room.setAmenities(request.getAmenities());
        room.setImageUrl(request.getImageUrl());
        if (request.getIsAvailable() != null) {
            room.setIsAvailable(request.getIsAvailable());
        }
        room.setUpdatedAt(java.time.LocalDateTime.now());

        Room saved = roomRepository.save(room);
        log.info("Room updated successfully: {}", id);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteRoom(Long id) {
        log.info("Deleting room: {}", id);

        if (!roomRepository.existsById(id)) {
            throw new RuntimeException("Room not found with ID: " + id);
        }

        // Check if room has any active bookings
        long activeBookings = bookingRepository.countByRoomIdAndStatusNotCancelled(id);
        if (activeBookings > 0) {
            throw new RuntimeException("Cannot delete room with active bookings");
        }

        long totalLinkedBookings = bookingRepository.countByRoomId(id);
        if (totalLinkedBookings > 0) {
            throw new RuntimeException("Cannot delete room with booking records. Mark it as unavailable instead.");
        }

        roomRepository.deleteById(id);
        log.info("Room deleted successfully: {}", id);
    }

    private RoomDTO convertToDTO(Room room) {
        return RoomDTO.builder()
                .id(room.getId())
                .name(room.getName())
                .type(room.getType())
                .capacity(room.getCapacity())
                .pricePerNight(room.getPricePerNight())
                .amenities(room.getAmenities())
                .imageUrl(room.getImageUrl())
                .isAvailable(room.getIsAvailable())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}

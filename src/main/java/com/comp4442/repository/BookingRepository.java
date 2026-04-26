package com.comp4442.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.comp4442.model.entity.Booking;

/**
 * Repository for Booking entity
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByRoomId(Long roomId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.room.id = :roomId " +
           "AND b.status != com.comp4442.model.entity.BookingStatus.CANCELLED " +
           "AND NOT (b.checkOut <= :checkIn OR b.checkIn >= :checkOut)")
    int countConflicting(@Param("roomId") Long roomId,
                         @Param("checkIn") LocalDate checkIn,
                         @Param("checkOut") LocalDate checkOut);

    @Query("SELECT b FROM Booking b WHERE b.status != com.comp4442.model.entity.BookingStatus.CANCELLED ORDER BY b.createdAt DESC")
    List<Booking> findAllActiveBookings();

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.room.id = :roomId " +
           "AND b.status != com.comp4442.model.entity.BookingStatus.CANCELLED")
    long countByRoomIdAndStatusNotCancelled(@Param("roomId") Long roomId);
}

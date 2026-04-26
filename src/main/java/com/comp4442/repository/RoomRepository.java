package com.comp4442.repository;

import com.comp4442.model.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repository for Room entity
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByIsAvailableTrue();

    List<Room> findByTypeAndIsAvailableTrue(String type);

    List<Room> findByCapacityGreaterThanEqualAndIsAvailableTrue(Integer capacity);

    @Query("SELECT r FROM Room r WHERE r.isAvailable = true " +
           "AND (:type IS NULL OR r.type = :type) " +
           "AND (:capacity IS NULL OR r.capacity >= :capacity) " +
           "AND (:minPrice IS NULL OR r.pricePerNight >= :minPrice) " +
           "AND (:maxPrice IS NULL OR r.pricePerNight <= :maxPrice)")
    List<Room> searchRooms(@Param("type") String type,
                           @Param("capacity") Integer capacity,
                           @Param("minPrice") BigDecimal minPrice,
                           @Param("maxPrice") BigDecimal maxPrice);
}

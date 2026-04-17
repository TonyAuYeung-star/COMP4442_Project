package com.comp4442.repository;

import com.comp4442.model.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Service entity
 */
@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    Optional<Service> findByServiceName(String serviceName);

    @Query("SELECT s FROM Service s WHERE s.status = :status AND s.isDeleted = false")
    List<Service> findByStatus(@Param("status") String status);

    @Query("SELECT s FROM Service s WHERE s.isDeleted = false ORDER BY s.createdAt DESC")
    List<Service> findAllActive();

    boolean existsByServiceName(String serviceName);
}

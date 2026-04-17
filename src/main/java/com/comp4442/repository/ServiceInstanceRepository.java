package com.comp4442.repository;

import com.comp4442.model.entity.ServiceInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ServiceInstance entity
 */
@Repository
public interface ServiceInstanceRepository extends JpaRepository<ServiceInstance, Long> {

    @Query("SELECT si FROM ServiceInstance si WHERE si.service.id = :serviceId AND si.status = 'REGISTERED'")
    List<ServiceInstance> findActiveInstancesByServiceId(@Param("serviceId") Long serviceId);

    @Query("SELECT si FROM ServiceInstance si WHERE si.instanceId = :instanceId")
    List<ServiceInstance> findByInstanceId(@Param("instanceId") String instanceId);

    @Query("SELECT COUNT(si) FROM ServiceInstance si WHERE si.service.id = :serviceId AND si.status = 'REGISTERED'")
    long countActiveInstancesByServiceId(@Param("serviceId") Long serviceId);
}

package com.comp4442.controller;

import com.comp4442.model.dto.ApiResponse;
import com.comp4442.model.entity.ServiceInstance;
import com.comp4442.repository.ServiceInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Service Instance Management
 */
@RestController
@RequestMapping("/v1/service-instances")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class ServiceInstanceController {

    private final ServiceInstanceRepository serviceInstanceRepository;

    /**
     * Get all active instances for a service (POST with JSON body)
     * POST /api/v1/service-instances/query/active
     */
    @PostMapping("/query/active")
    public ResponseEntity<ApiResponse<List<ServiceInstance>>> queryActiveInstances(
            @RequestBody Map<String, Long> request) {
        Long serviceId = request.get("serviceId");
        log.info("Fetching active instances for service ID: {}", serviceId);
        
        if (serviceId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, "serviceId is required"));
        }
        
        List<ServiceInstance> instances = serviceInstanceRepository.findActiveInstancesByServiceId(serviceId);
        return ResponseEntity.ok(ApiResponse.success("Active instances retrieved", instances));
    }

    /**
     * Get instance details
     * GET /api/v1/service-instances/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceInstance>> getInstanceById(@PathVariable Long id) {
        log.info("Fetching instance with ID: {}", id);
        try {
            ServiceInstance instance = serviceInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instance not found with ID: " + id));
            return ResponseEntity.ok(ApiResponse.success("Instance retrieved successfully", instance));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, e.getMessage()));
        }
    }

    /**
     * Get instance count for a service (POST with JSON body)
     * POST /api/v1/service-instances/query/count
     */
    @PostMapping("/query/count")
    public ResponseEntity<ApiResponse<Long>> queryInstanceCount(
            @RequestBody Map<String, Long> request) {
        Long serviceId = request.get("serviceId");
        log.info("Counting active instances for service ID: {}", serviceId);
        
        if (serviceId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, "serviceId is required"));
        }
        
        long count = serviceInstanceRepository.countActiveInstancesByServiceId(serviceId);
        return ResponseEntity.ok(ApiResponse.success("Instance count: " + count, count));
    }

    /**
     * Register a new service instance
     * POST /api/v1/service-instances
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ServiceInstance>> registerInstance(
            @RequestBody ServiceInstance request) {
        log.info("Registering new service instance: {}", request.getInstanceId());
        try {
            request.setStatus("REGISTERED");
            request.setHeartbeatTime(System.currentTimeMillis());
            ServiceInstance saved = serviceInstanceRepository.save(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Instance registered successfully", saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Update instance heartbeat
     * PUT /api/v1/service-instances/{id}/heartbeat
     */
    @PutMapping("/{id}/heartbeat")
    public ResponseEntity<ApiResponse<Void>> updateHeartbeat(@PathVariable Long id) {
        log.info("Updating heartbeat for instance ID: {}", id);
        try {
            ServiceInstance instance = serviceInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instance not found"));
            instance.setHeartbeatTime(System.currentTimeMillis());
            serviceInstanceRepository.save(instance);
            return ResponseEntity.ok(ApiResponse.success("Heartbeat updated successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, e.getMessage()));
        }
    }

    /**
     * Unregister service instance
     * DELETE /api/v1/service-instances/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> unregisterInstance(@PathVariable Long id) {
        log.info("Unregistering instance with ID: {}", id);
        try {
            ServiceInstance instance = serviceInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instance not found"));
            instance.setStatus("UNREGISTERED");
            serviceInstanceRepository.save(instance);
            return ResponseEntity.ok(ApiResponse.success("Instance unregistered successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, e.getMessage()));
        }
    }
}

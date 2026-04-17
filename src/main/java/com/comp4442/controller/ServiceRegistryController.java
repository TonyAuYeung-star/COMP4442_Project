package com.comp4442.controller;

import com.comp4442.model.dto.ApiResponse;
import com.comp4442.model.dto.ServiceDTO;
import com.comp4442.service.ServiceRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Service Registry Operations
 */
@RestController
@RequestMapping("/v1/services")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class ServiceRegistryController {

    private final ServiceRegistry serviceRegistry;

    /**
     * Register a new service
     * POST /api/v1/services
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ServiceDTO>> registerService(
            @RequestBody ServiceDTO request) {
        log.info("Received request to register service: {}", request.getServiceName());
        try {
            ServiceDTO result = serviceRegistry.registerService(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Service registered successfully", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * Get all services
     * GET /api/v1/services
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceDTO>>> getAllServices() {
        log.info("Fetching all services");
        List<ServiceDTO> services = serviceRegistry.getAllServices();
        return ResponseEntity.ok(ApiResponse.success("Retrieved all services", services));
    }

    /**
     * Get service by ID
     * GET /api/v1/services/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceDTO>> getServiceById(@PathVariable Long id) {
        log.info("Fetching service with ID: {}", id);
        try {
            ServiceDTO service = serviceRegistry.getServiceById(id);
            return ResponseEntity.ok(ApiResponse.success("Service retrieved successfully", service));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, e.getMessage()));
        }
    }

    /**
     * Query service by name (POST with JSON body)
     * POST /api/v1/services/query/by-name
     */
    @PostMapping("/query/by-name")
    public ResponseEntity<ApiResponse<ServiceDTO>> queryServiceByName(
            @RequestBody Map<String, String> request) {
        String serviceName = request.get("serviceName");
        log.info("Fetching service by name: {}", serviceName);
        
        if (serviceName == null || serviceName.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, "serviceName is required"));
        }
        
        try {
            ServiceDTO service = serviceRegistry.getServiceByName(serviceName);
            return ResponseEntity.ok(ApiResponse.success("Service retrieved successfully", service));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, e.getMessage()));
        }
    }

    /**
     * Query services by status (POST with JSON body)
     * POST /api/v1/services/query/by-status
     */
    @PostMapping("/query/by-status")
    public ResponseEntity<ApiResponse<List<ServiceDTO>>> queryServicesByStatus(
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        log.info("Fetching services with status: {}", status);
        
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, "status is required"));
        }
        
        List<ServiceDTO> services = serviceRegistry.getServicesByStatus(status);
        return ResponseEntity.ok(ApiResponse.success("Services retrieved successfully", services));
    }

    /**
     * Update service
     * PUT /api/v1/services/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceDTO>> updateService(
            @PathVariable Long id,
            @RequestBody ServiceDTO request) {
        log.info("Updating service with ID: {}", id);
        try {
            ServiceDTO result = serviceRegistry.updateService(id, request);
            return ResponseEntity.ok(ApiResponse.success("Service updated successfully", result));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, e.getMessage()));
        }
    }

    /**
     * Delete service
     * DELETE /api/v1/services/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable Long id) {
        log.info("Deleting service with ID: {}", id);
        try {
            serviceRegistry.deleteService(id);
            return ResponseEntity.ok(ApiResponse.success("Service deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, e.getMessage()));
        }
    }
}

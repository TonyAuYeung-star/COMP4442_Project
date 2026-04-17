package com.comp4442.service;

import com.comp4442.model.dto.ServiceDTO;
// import com.comp4442.model.entity.Service;
import com.comp4442.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service Registry - Core business service for managing microservices
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ServiceRegistry {

    private final ServiceRepository serviceRepository;

    /**
     * Register a new service in the registry
     */
    @Transactional
    public ServiceDTO registerService(ServiceDTO request) {
        log.info("Registering new service: {}", request.getServiceName());

        if (serviceRepository.existsByServiceName(request.getServiceName())) {
            throw new IllegalArgumentException(
                "Service with name " + request.getServiceName() + " already exists"
            );
        }

        com.comp4442.model.entity.Service service = com.comp4442.model.entity.Service.builder()
            .serviceName(request.getServiceName())
            .host(request.getHost())
            .port(request.getPort())
            .status("ACTIVE")
            .description(request.getDescription())
            .healthCheckUrl(request.getHealthCheckUrl())
            .version(request.getVersion())
            .build();

        com.comp4442.model.entity.Service saved = serviceRepository.save(service);
        log.info("Service registered successfully: {}", request.getServiceName());
        return convertToDTO(saved);
    }

    /**
     * Get all active services
     */
    @Transactional(readOnly = true)
    public List<ServiceDTO> getAllServices() {
        return serviceRepository.findAllActive()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get service by name
     */
    @Transactional(readOnly = true)
    public ServiceDTO getServiceByName(String serviceName) {
        com.comp4442.model.entity.Service service = serviceRepository.findByServiceName(serviceName)
            .orElseThrow(() -> new RuntimeException("Service not found: " + serviceName));
        return convertToDTO(service);
    }

    /**
     * Get service by ID
     */
    @Transactional(readOnly = true)
    public ServiceDTO getServiceById(Long id) {
        com.comp4442.model.entity.Service service = serviceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Service not found with ID: " + id));
        return convertToDTO(service);
    }

    /**
     * Update service
     */
    @Transactional
    public ServiceDTO updateService(Long id, ServiceDTO request) {
        log.info("Updating service with ID: {}", id);

        com.comp4442.model.entity.Service service = serviceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Service not found with ID: " + id));

        if (request.getHost() != null) service.setHost(request.getHost());
        if (request.getPort() != null) service.setPort(request.getPort());
        if (request.getStatus() != null) service.setStatus(request.getStatus());
        if (request.getDescription() != null) service.setDescription(request.getDescription());
        if (request.getHealthCheckUrl() != null) service.setHealthCheckUrl(request.getHealthCheckUrl());
        if (request.getVersion() != null) service.setVersion(request.getVersion());

        com.comp4442.model.entity.Service updated = serviceRepository.save(service);
        log.info("Service updated successfully: {}", id);
        return convertToDTO(updated);
    }

    /**
     * Delete service (soft delete)
     */
    @Transactional
    public void deleteService(Long id) {
        log.info("Deleting service with ID: {}", id);

        com.comp4442.model.entity.Service service = serviceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Service not found with ID: " + id));

        service.setIsDeleted(true);
        serviceRepository.save(service);
        log.info("Service deleted successfully: {}", id);
    }

    /**
     * Get services by status
     */
    @Transactional(readOnly = true)
    public List<ServiceDTO> getServicesByStatus(String status) {
        return serviceRepository.findByStatus(status)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Convert entity to DTO
     */
    private ServiceDTO convertToDTO(com.comp4442.model.entity.Service service) {
        return ServiceDTO.builder()
            .id(service.getId())
            .serviceName(service.getServiceName())
            .host(service.getHost())
            .port(service.getPort())
            .status(service.getStatus())
            .description(service.getDescription())
            .healthCheckUrl(service.getHealthCheckUrl())
            .version(service.getVersion())
            .createdAt(service.getCreatedAt())
            .updatedAt(service.getUpdatedAt())
            .build();
    }
}

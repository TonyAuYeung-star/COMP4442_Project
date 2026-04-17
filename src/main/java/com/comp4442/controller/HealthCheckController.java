package com.comp4442.controller;

import com.comp4442.model.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Health Check and Status Controller
 */
@RestController
@RequestMapping("/v1")
@Slf4j
public class HealthCheckController {

    /**
     * Health check endpoint
     * GET /api/v1/health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        log.info("Health check requested");

        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("service", "COMP4442 Service Computing Backend");
        data.put("version", "1.0.0");
        data.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * Application info endpoint
     * GET /api/v1/info
     */
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> info() {
        log.info("Info requested");

        Map<String, Object> data = new HashMap<>();
        data.put("applicationName", "COMP4442 Service Computing Backend");
        data.put("version", "1.0.0");
        data.put("description", "Microservice Registry on AWS EC2");
        data.put("environment", System.getenv("ENVIRONMENT") != null ? 
            System.getenv("ENVIRONMENT") : "development");
        data.put("javaVersion", System.getProperty("java.version"));

        return ResponseEntity.ok(ApiResponse.success(data));
    }
}

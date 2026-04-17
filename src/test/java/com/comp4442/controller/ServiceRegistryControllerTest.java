package com.comp4442.controller;

import com.comp4442.model.dto.ApiResponse;
import com.comp4442.model.dto.ServiceDTO;
import com.comp4442.service.ServiceRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ServiceRegistryController
 */
@SpringBootTest
@AutoConfigureMockMvc
public class ServiceRegistryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // @Autowired
    // private ServiceRegistry serviceRegistry;

    @BeforeEach
    public void setUp() {
        // Clear any existing data before each test
    }

    @Test
    public void testRegisterService_Success() throws Exception {
        String serviceName = "test-service-" + System.currentTimeMillis();
        String request = String.format("""
            {
                "serviceName": "%s",
                "host": "localhost",
                "port": 9090,
                "description": "Test service",
                "healthCheckUrl": "/health",
                "version": "1.0.0"
            }
            """, serviceName);

        mockMvc.perform(post("/api/v1/services")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.message").value("Service registered successfully"))
            .andExpect(jsonPath("$.data.serviceName").value(serviceName));
    }

    @Test
    public void testGetAllServices_Success() throws Exception {
        mockMvc.perform(get("/api/v1/services")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data", isA(java.util.List.class)));
    }

    @Test
    public void testGetServiceById_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/services/999")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    public void testGetHealth_Success() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    public void testGetInfo_Success() throws Exception {
        mockMvc.perform(get("/api/v1/info")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.applicationName").exists());
    }
}

package com.comp4442.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for Service
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ServiceDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String serviceName;
    private String host;
    private Integer port;
    private String status;
    private String description;
    private String healthCheckUrl;
    private String version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

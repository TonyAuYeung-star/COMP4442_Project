package com.comp4442.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Service Entity - represents a micro-service in the service registry
 */
@Entity
@Table(name = "services")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Service extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String serviceName;

    @Column(nullable = false)
    private String host;

    @Column(nullable = false)
    private Integer port;

    @Column(nullable = false)
    private String status;  // ACTIVE, INACTIVE, MAINTENANCE

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "health_check_url")
    private String healthCheckUrl;

    @Column(name = "version")
    private String version;
}

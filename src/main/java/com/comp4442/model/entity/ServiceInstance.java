package com.comp4442.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Service Instance Entity - represents individual service instances for load balancing
 */
@Entity
@Table(name = "service_instances")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceInstance extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(nullable = false)
    private String instanceId;

    @Column(nullable = false)
    private String hostname;

    @Column(nullable = false)
    private Integer port;

    @Column(nullable = false)
    private String status;  // REGISTERED, UNREGISTERED, DOWN

    @Column(name = "heartbeat_time")
    private Long heartbeatTime;

    @Column(columnDefinition = "TEXT")
    private String metadata;
}

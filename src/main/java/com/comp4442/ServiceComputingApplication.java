package com.comp4442;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Main Spring Boot Application Entry Point
 * COMP4442 Service Computing - AWS EC2 Deployment
 */
@SpringBootApplication
@EnableJpaRepositories(
    basePackages = "com.comp4442.repository"
)
@ComponentScan(basePackages = {
    "com.comp4442.controller",
    "com.comp4442.service",
    "com.comp4442.repository",
    "com.comp4442.config"
})
public class ServiceComputingApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceComputingApplication.class, args);
    }
}

package com.comp4442.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Application Configuration
 */
@Configuration
@EnableJpaAuditing
@EnableAspectJAutoProxy
public class ApplicationConfig {
    // Additional beans can be defined here as needed
}

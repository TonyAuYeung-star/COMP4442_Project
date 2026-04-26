package com.comp4442.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for searching rooms with filters
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoomSearchRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private String type;
    private Integer capacity;

    @DecimalMin(value = "0.0", message = "Min price must be no less than 0")
    private BigDecimal minPrice;

    @DecimalMin(value = "0.0", message = "Max price must be no less than 0")
    private BigDecimal maxPrice;

    private LocalDate checkIn;
    private LocalDate checkOut;
}

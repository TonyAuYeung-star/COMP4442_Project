package com.comp4442.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * Request DTO for creating a booking
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingCreateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long roomId;
    private LocalDate checkIn;
    private LocalDate checkOut;
}

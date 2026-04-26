package com.comp4442.model.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregated booking metrics for the home page.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingOverviewDTO {
    private Long confirmedBookingCount;
    private Long pendingBookingCount;
    private BigDecimal confirmedRevenue;
}

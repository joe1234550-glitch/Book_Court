package com.example.starter.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBookingRequest {
        @NotNull
        private Long courtId;

        @NotNull
        private LocalDateTime startTime;

        @NotNull
        private LocalDateTime endTime;

        @Min(0)
        private Integer totalFee;

        private String status;
}

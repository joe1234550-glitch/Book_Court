package com.example.starter.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

// 建立預約請求 DTO
@Data
public class CreateBookingRequest {
    @NotNull(message = "球場 ID 不能為空")
    private Long courtId;

    @NotNull(message = "開始時間不能為空")
    private LocalDateTime startTime;

    @NotNull(message = "結束時間不能為空")
    private LocalDateTime endTime;
}

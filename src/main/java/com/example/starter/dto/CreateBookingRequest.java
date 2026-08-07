package com.example.starter.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "建立預約請求 DTO")
public class CreateBookingRequest {

        @Schema(description = "使用者 ID (管理員代預約時指定)", example = "1")
        private Long userId; // 🎯 補上這個欄位

        @NotNull(message = "球場 ID 不能為空")
        @Schema(description = "球場 ID", example = "1")
        private Long courtId;

        @NotNull(message = "開始時間不能為空")
        @Future(message = "預約開始時間必須為未來時間")
        @Schema(description = "預約開始時間", example = "2026-08-10T14:00:00")
        private LocalDateTime startTime;

        @NotNull(message = "結束時間不能為空")
        @Future(message = "預約結束時間必須為未來時間")
        @Schema(description = "預約結束時間", example = "2026-08-10T16:00:00")
        private LocalDateTime endTime;

        @Schema(description = "優惠折扣碼 (可選)", example = "SUMMER2026")
        private String promoCode;
}
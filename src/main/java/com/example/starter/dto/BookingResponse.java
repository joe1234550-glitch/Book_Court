package com.example.starter.dto;

import com.example.starter.entity.Booking;
import com.example.starter.entity.Emum.CheckInStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// 預約回應 DTO (避免直接暴露 Entity)
@Data
@Builder
public class BookingResponse {
    private Long id;
    private Long userId;
    private String username;
    private Long courtId;
    private String courtName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer totalFee;
    private String status;
    private boolean checkedIn;
    private LocalDateTime checkInTime;
    private CheckInStatus checkInStatus;
    private LocalDateTime createdAt;

    public static BookingResponse fromEntity(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .username(booking.getUser().getUsername())
                .courtId(booking.getCourt().getId())
                .courtName(booking.getCourt().getName())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .totalFee(booking.getTotalFee())
                .status(booking.getStatus())
                .checkedIn(booking.isCheckedIn())
                .checkInTime(booking.getCheckInTime())
                .checkInStatus(booking.getCheckInStatus())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}

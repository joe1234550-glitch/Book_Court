package com.example.starter.controller;
import com.example.starter.entity.Booking;
import com.example.starter.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // 1. [已登入會員] 發起球場預約
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Booking> createBooking(
            @RequestParam Long userId,
            @RequestParam Long courtId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        Booking createdBooking = bookingService.createBooking(userId, courtId, startTime, endTime);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBooking);
    }

    // 2. [已登入會員] 查詢指定使用者的預約紀錄
    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getBookingsByUserId(userId));
    }

    // 3. [會員/管理員] 取消預約
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.noContent().build();
    }
}

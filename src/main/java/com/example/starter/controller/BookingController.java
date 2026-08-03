package com.example.starter.controller;
import com.example.starter.dto.BookingResponse;
import com.example.starter.dto.CreateBookingRequest;
import com.example.starter.entity.Booking;
import com.example.starter.security.UserPrincipal;
import com.example.starter.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // 1. [會員] 發起預約 (改用 @RequestBody + DTO)
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> createBooking(
            @AuthenticationPrincipal UserPrincipal currentUser, // 取得當前登入者 ID
            @Valid @RequestBody CreateBookingRequest request) {

        BookingResponse response = bookingService.createBooking(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. [會員] 查詢「自己」的預約紀錄 (安全，不露 userId 給路徑)
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(bookingService.getBookingsByUserId(currentUser.getId()));
    }

    // 3. 🎯 [會員/櫃檯] 現場報到 API
    @PatchMapping("/{id}/check-in")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> checkInBooking(@PathVariable Long id) {
        BookingResponse response = bookingService.checkInBooking(id);
        return ResponseEntity.ok(response);
    }

    // 4. [會員] 取消預約 (改用 PATCH 語意)
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        bookingService.cancelBooking(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}

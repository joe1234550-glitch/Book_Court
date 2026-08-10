package com.example.starter.controller;

import com.example.starter.dto.*;
import com.example.starter.service.AdminBookingService;
import com.example.starter.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@RequiredArgsConstructor
@Tag(name = "管理員-預約管理 API")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    private final AdminBookingService adminBookingService;
    private final AdminService adminService;

    @Operation(summary = "取得所有預約紀錄")
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(adminBookingService.getAllBookings());
    }

    @Operation(summary = "建立預約 (管理員)")
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        var resp = adminService.createBooking(request.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @Operation(summary = "更新預約 (管理員)")
    @PutMapping("/{id}")
    public ResponseEntity<BookingResponse> updateBooking(@PathVariable Long id, @Valid @RequestBody UpdateBookingRequest request) {
        var resp = adminService.updateBooking(id, request);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "取消任意預約")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        adminService.cancelBooking(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "櫃檯現場結帳並記帳")
    @PostMapping("/{id}/checkout")
    public ResponseEntity<BookingResponse> checkoutBooking(
            @PathVariable Long id,
            @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(adminBookingService.checkoutBooking(id, request));
    }

    @Operation(summary = "櫃檯現場辦理退費")
    @PostMapping("/{id}/refund")
    public ResponseEntity<BookingResponse> refundBooking(@PathVariable Long id) {
        return ResponseEntity.ok(adminBookingService.refundBooking(id));
    }
}

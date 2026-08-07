package com.example.starter.controller;

import com.example.starter.dto.BookingResponse;
import com.example.starter.dto.CreateBookingRequest;
import com.example.starter.dto.UpdateBookingRequest;
import com.example.starter.dto.UpdateUserRequest;
import com.example.starter.dto.CreateUserRequest;
import com.example.starter.entity.User;
import com.example.starter.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "5. 管理員專屬 API", description = "提供管理員檢視所有預約、管理使用者與球場狀態的操作")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;
    private final com.example.starter.service.CourtService courtService;

    @Operation(summary = "取得所有預約紀錄", description = "管理員可以檢視系統內全部使用者的所有球場預約資料")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "取得成功"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "權限不足"),
    })
    @GetMapping("/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(adminService.getAllBookings());
    }

    @Operation(summary = "取消任意預約", description = "管理員可以取消任何使用者的預約紀錄")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "取消成功"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "權限不足"),
            @ApiResponse(responseCode = "404", description = "找不到該預約"),
    })
    @PatchMapping("/bookings/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        adminService.cancelBooking(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "建立一般使用者", description = "管理員可建立新的會員帳號（預設 ROLE_USER）")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "建立成功"),
            @ApiResponse(responseCode = "400", description = "請求格式錯誤或帳號/Email 已存在"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "權限不足"),
    })
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@Valid @RequestBody CreateUserRequest request) {
        User created = adminService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "取得所有使用者", description = "管理員可以查看所有會員帳號清單")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "取得成功"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "權限不足"),
    })
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @Operation(summary = "取得所有球場 (管理員)", description = "管理員可以檢視系統內全部球場（包含非 AVAILABLE）的清單")
    @GetMapping("/courts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<com.example.starter.entity.Court>> getAllCourts() {
        return ResponseEntity.ok(courtService.getAllCourts());
    }

    @Operation(summary = "刪除球場 (管理員)", description = "管理員可刪除球場（若有任何預約則拒絕刪除）")
    @DeleteMapping("/courts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCourt(@PathVariable Long id) {
        courtService.deleteCourt(id, adminService.getBookingRepository());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "建立預約 (管理員)", description = "管理員可為任一使用者建立預約")
    @PostMapping("/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        // 🎯 這裡改傳 2 個參數：request.getUserId() 與 request
        var resp = adminService.createBooking(request.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @Operation(summary = "更新預約 (管理員)", description = "管理員可更新任一預約的時間、球場或狀態")
    @PutMapping("/bookings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> updateBooking(@PathVariable Long id, @Valid @RequestBody UpdateBookingRequest request) {
        var resp = adminService.updateBooking(id, request);
        return ResponseEntity.ok(resp);
    }

    @Operation(summary = "更新使用者 (管理員)", description = "管理員可更新使用者基本資訊與角色")
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        var updated = adminService.updateUser(id, request);
        return ResponseEntity.ok(updated);
    }
}

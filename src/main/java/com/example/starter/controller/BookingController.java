package com.example.starter.controller;
import com.example.starter.dto.BookingResponse;
import com.example.starter.dto.CreateBookingRequest;
import com.example.starter.entity.Booking;
import com.example.starter.security.UserPrincipal;
import com.example.starter.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "2. 球場預約管理 API", description = "提供會員發起預約、查詢個人預約紀錄、現場 QR Code 報到與取消預約功能")
@SecurityRequirement(name = "bearerAuth") // 🔒 需要 Bearer JWT Token 認證
public class BookingController {

    private final BookingService bookingService;

    // 1. [會員] 發起預約
    @Operation(summary = "發起預約", description = "會員選擇球場與時段發起預約，系統會自動檢查時段是否重疊衝突")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "預約成功"),
            @ApiResponse(responseCode = "400", description = "請求資料格式錯誤"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "409", description = "時段衝突（該球場該時段已被預約）")
    })
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> createBooking(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser, // Swagger 隱藏內部注入的 Principal
            @Valid @RequestBody CreateBookingRequest request) {

        BookingResponse response = bookingService.createBooking(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. [會員] 查詢「自己」的預約紀錄
    @Operation(summary = "查詢個人預約紀錄", description = "取得目前登入會員的所有球場預約列表（包含待報到、已完成與已取消）")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "成功取得預約紀錄列表"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期")
    })
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getMyBookings(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(bookingService.getBookingsByUserId(currentUser.getId()));
    }

    // 3. 🎯 [會員/櫃檯] 現場報到 API
    @Operation(summary = "現場報到", description = "會員掃描 QR Code 或由櫃檯輸入預約 ID 進行現場報到，更新報到狀態與報到時間")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "報到成功"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "404", description = "找不到該筆預約紀錄"),
            @ApiResponse(responseCode = "409", description = "該筆預約狀態不可報到（如已報到或已取消）")
    })
    @PatchMapping("/{id}/check-in")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> checkInBooking(
            @Parameter(description = "預約紀錄 ID", example = "1") @PathVariable Long id) {

        BookingResponse response = bookingService.checkInBooking(id);
        return ResponseEntity.ok(response);
    }

    // 4. [會員] 取消預約
    @Operation(summary = "取消預約", description = "會員取消尚未執行的預約（僅限本人或管理員操作）")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "取消預約成功（無回傳內容）"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "無權限取消他人的預約"),
            @ApiResponse(responseCode = "404", description = "找不到該筆預約紀錄")
    })
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> cancelBooking(
            @Parameter(description = "預約紀錄 ID", example = "1") @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal currentUser) {

        bookingService.cancelBooking(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
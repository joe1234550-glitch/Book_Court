package com.example.starter.controller;
import com.example.starter.entity.Court;
import com.example.starter.entity.Emum.CourtStatus;
import com.example.starter.service.CourtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courts")
@RequiredArgsConstructor
@Tag(name = "3. 球場管理 API", description = "提供所有人查詢球場清單與細節，以及管理員 (ADMIN) 新增球場與切換球場狀態（如維修中）")
public class CourtController {

    private final CourtService courtService;

    // 1. [所有人/會員] 取得開放中的球場清單
    @Operation(summary = "查詢所有開放中的球場", description = "取得目前系統中狀態為開放中 (AVAILABLE) 的球場清單")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "成功取得球場清單")
    })
    @SecurityRequirements // 🌐 公開 API：無需帶入 Bearer Token 即可呼叫
    @GetMapping
    public ResponseEntity<List<Court>> getAvailableCourts() {
        return ResponseEntity.ok(courtService.getAvailableCourts());
    }

    // 2. [所有人/會員] 依 ID 查詢單一球場
    @Operation(summary = "依 ID 查詢單一球場細節", description = "取得指定 ID 球場的詳細資訊（名稱、類型、狀態等）")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "成功取得球場細節"),
            @ApiResponse(responseCode = "404", description = "找不到該球場")
    })
    @SecurityRequirements // 🌐 公開 API
    @GetMapping("/{id}")
    public ResponseEntity<Court> getCourtById(
            @Parameter(description = "球場 ID", example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(courtService.getCourtById(id));
    }

    // 3. [僅限 ADMIN] 新增球場
    @Operation(summary = "新增球場", description = "建立新的網球場資料（僅限管理者 ROLE_ADMIN 操作）")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "球場新增成功"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "權限不足（非管理員帳號）")
    })
    @SecurityRequirement(name = "bearerAuth") // 🔒 需要 ADMIN 權限 Token
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Court> createCourt(@RequestBody Court court) {
        Court created = courtService.createCourt(court);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 4. [僅限 ADMIN] 更新球場狀態
    @Operation(summary = "更新球場狀態", description = "修改指定球場的營運狀態，例如改為 MAINTENANCE (維修中) 或 CLOSED (關閉)（僅限管理者 ROLE_ADMIN 操作）")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "狀態更新成功"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "權限不足（非管理員帳號）"),
            @ApiResponse(responseCode = "404", description = "找不到該球場")
    })
    @SecurityRequirement(name = "bearerAuth") // 🔒 需要 ADMIN 權限 Token
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Court> updateCourtStatus(
            @Parameter(description = "球場 ID", example = "1") @PathVariable Long id,
            @Parameter(description = "目標狀態（如 AVAILABLE, MAINTENANCE, CLOSED）", example = "MAINTENANCE")
            @RequestParam CourtStatus status) {

        Court updated = courtService.updateCourtStatus(id, status);
        return ResponseEntity.ok(updated);
    }
}
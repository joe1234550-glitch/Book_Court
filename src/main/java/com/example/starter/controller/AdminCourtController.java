package com.example.starter.controller;
import com.example.starter.dto.CreateCourtRequest;
import com.example.starter.entity.Court;
import com.example.starter.entity.Emum.CourtStatus;
import com.example.starter.service.AdminCourtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/courts")
@RequiredArgsConstructor
@Tag(name = "管理員-球場管理 API", description = "提供管理員 (ADMIN) 管理所有球場資料、新增、狀態切換與刪除")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminCourtController {

    private final AdminCourtService adminCourtService;

    @Operation(summary = "取得所有球場列表 (包含維修中與關閉)")
    @GetMapping
    public ResponseEntity<List<Court>> getAllCourts() {
        return ResponseEntity.ok(adminCourtService.getAllCourts());
    }

    @Operation(summary = "新增球場")
    @PostMapping
    public ResponseEntity<Court> createCourt(@RequestBody CreateCourtRequest request) { // 👈 改用 DTO
        Court created = adminCourtService.createCourt(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "更新球場狀態")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Court> updateCourtStatus(
            @Parameter(description = "球場 ID") @PathVariable Long id,
            @Parameter(description = "目標狀態 (AVAILABLE, MAINTENANCE, CLOSED)") @RequestParam CourtStatus status) {
        Court updated = adminCourtService.updateCourtStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "刪除球場")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourt(@Parameter(description = "球場 ID") @PathVariable Long id) {
        adminCourtService.deleteCourt(id);
        return ResponseEntity.noContent().build();
    }
}

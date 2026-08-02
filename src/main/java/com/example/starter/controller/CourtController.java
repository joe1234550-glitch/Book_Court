package com.example.starter.controller;
import com.example.starter.entity.Court;
import com.example.starter.entity.Emum.CourtStatus;
import com.example.starter.service.CourtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courts")
@RequiredArgsConstructor
public class CourtController {

    private final CourtService courtService;

    // 1. [所有人/會員] 取得開放中的球場清單
    @GetMapping
    public ResponseEntity<List<Court>> getAvailableCourts() {
        return ResponseEntity.ok(courtService.getAvailableCourts());
    }

    // 2. [所有人/會員] 依 ID 查詢單一球場
    @GetMapping("/{id}")
    public ResponseEntity<Court> getCourtById(@PathVariable Long id) {
        return ResponseEntity.ok(courtService.getCourtById(id));
    }

    // 3. [僅限 ADMIN] 新增球場
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Court> createCourt(@RequestBody Court court) {
        Court created = courtService.createCourt(court);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 4. [僅限 ADMIN] 更新球場狀態 (例如改為 MAINTENANCE 維修中)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Court> updateCourtStatus(
            @PathVariable Long id,
            @RequestParam CourtStatus status) {
        Court updated = courtService.updateCourtStatus(id, status);
        return ResponseEntity.ok(updated);
    }
}

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
@Tag(name = "球場公開 API", description = "提供所有人查詢開放中球場清單與細節")
public class CourtController {

    private final CourtService courtService;

    @Operation(summary = "查詢所有開放中的球場")
    @SecurityRequirements
    @GetMapping
    public ResponseEntity<List<Court>> getAvailableCourts() {
        return ResponseEntity.ok(courtService.getAvailableCourts());
    }

    @Operation(summary = "依 ID 查詢單一球場細節")
    @SecurityRequirements
    @GetMapping("/{id}")
    public ResponseEntity<Court> getCourtById(@Parameter(description = "球場 ID") @PathVariable Long id) {
        return ResponseEntity.ok(courtService.getCourtById(id));
    }
}
package com.example.starter.controller;
import com.example.starter.entity.FinancialTransaction;

import com.example.starter.service.AdminFinancialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


import java.time.LocalDate;

import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/financial") // 🎯 建議統一加上 /api/v1，並與普通 booking 區隔
//@PreAuthorize("hasRole('ADMIN')")           // 🎯 補上管理員權限控制
public class AdminFinancialController {

    @Autowired
    private AdminFinancialService financialService;

    @PostMapping("/bookings/{bookingId}/checkout")
    public ResponseEntity<?> checkoutBooking(
            @PathVariable Long bookingId,
            @RequestBody Map<String, Object> payload) {
        FinancialTransaction saved = financialService.processCheckout(bookingId, payload);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/financial-report")
    public ResponseEntity<?> getFinancialReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String paymentMethod) {
        Map<String, Object> report = financialService.generateFinancialReport(startDate, endDate, paymentMethod);
        // 2. 加上這兩行觀察 Spring Security 實際上抓到什麼
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("====== 🔍 Security 權限偵測 ======");
        System.out.println("使用者帳號: " + auth.getName());
        System.out.println("抓到的權限列表: " + auth.getAuthorities());
        System.out.println("=================================");
        return ResponseEntity.ok(report);
    }
}
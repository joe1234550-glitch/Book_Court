package com.example.starter.controller;

import com.example.starter.entity.PromoCode;
import com.example.starter.service.PromoCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    @GetMapping("/validate")
    public ResponseEntity<PromoCode> validatePromoCode(@RequestParam String code) {
        PromoCode promoCode = promoCodeService.validatePromoCode(code);
        return ResponseEntity.ok(promoCode);
    }
}

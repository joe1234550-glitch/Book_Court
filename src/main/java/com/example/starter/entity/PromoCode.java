package com.example.starter.entity;

import jakarta.persistence.*;
import lombok.*;


import java.time.LocalDateTime;

@Entity
@Table(name = "promo_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // 折扣碼字串 (如 SUMMER2026)

    @Column(name = "discount_amount", nullable = false)
    private Integer discountAmount; // 折扣金額

    @Column(name = "max_uses", nullable = false)
    private Integer maxUses = 1; // 可使用上限次數

    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0; // 已使用次數

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime; // 開啟/生效時間

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime; // 截止時間

    @Column(nullable = false)
    private Boolean enabled = true; // 是否啟用

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
package com.example.starter.entity;


import jakarta.persistence.*;
import lombok.*;


import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 對應的預約 ID
    @Column(name = "booking_id")
    private Long bookingId;

    // 會員名稱
    @Column(name = "user_name")
    private String userName;

    // 場地名稱
    @Column(name = "court_name")
    private String courtName;

    // 交易金額
    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    // 支付方式 (CASH, CREDIT_CARD, LINE_PAY)
    @Column(name = "payment_method")
    private String paymentMethod;

    // 交易狀態 (SUCCESS, REFUNDED)
    @Column(name = "status", nullable = false)
    private String status;

    // 交易時間
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}

package com.example.starter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    // 實收金額（若為空，後端會預設使用預約表單中的 totalFee）
    private BigDecimal amount;

    // 支付方式：例如 CASH (現金), CREDIT_CARD (信用卡), LINE_PAY (LINE Pay)
    private String paymentMethod;
}

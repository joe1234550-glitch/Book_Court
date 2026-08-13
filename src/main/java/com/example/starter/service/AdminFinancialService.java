package com.example.starter.service;

import com.example.starter.entity.FinancialTransaction;
import com.example.starter.repository.FinancialTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminFinancialService {

    @Autowired
    private FinancialTransactionRepository financialRepository;

    // 處理結帳寫入流水帳
    public FinancialTransaction processCheckout(Long bookingId, Map<String, Object> payload) {
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        String paymentMethod = (String) payload.get("paymentMethod");
        String userName = payload.get("userName") != null ? (String) payload.get("userName") : "會員";
        String courtName = payload.get("courtName") != null ? (String) payload.get("courtName") : "網球場";

        FinancialTransaction transaction = FinancialTransaction.builder()
                .bookingId(bookingId)
                .userName(userName)
                .courtName(courtName)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build();

        return financialRepository.save(transaction);
    }

    // 🎯 修復 500 錯誤：給予預設時間與空值保護
    public Map<String, Object> generateFinancialReport(LocalDate startDate, LocalDate endDate, String paymentMethod) {
        // 1. 如果沒傳日期，預設給 2000-01-01 到 2099-12-31，避免 SQL 傳 null 轉型失敗
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : LocalDateTime.of(2099, 12, 31, 23, 59, 59);

        // 2. 處理支付方式：如果是 ALL 或空值，傳入 null 給 SQL 做全選
        String method = (paymentMethod == null || paymentMethod.isBlank() || "ALL".equalsIgnoreCase(paymentMethod.trim()))
                ? null
                : paymentMethod.trim();

        List<FinancialTransaction> transactions;
        try {
            if (method == null) {
                // 全選支付方式：只查時間區間
                transactions = financialRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
            } else {
                // 特定支付方式 (CASH / LINE_PAY / CREDIT_CARD)
                transactions = financialRepository.findByCreatedAtBetweenAndPaymentMethodOrderByCreatedAtDesc(start, end, method);
            }
        } catch (Exception e) {
            System.err.println("❌ [Service Error] 查詢 DB 失敗，完整報錯如下：");
            e.printStackTrace(); // 發生錯誤時在 Terminal 印出完整 StackTrace，方便觀察
            transactions = new ArrayList<>();
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalRefunds = BigDecimal.ZERO;
        long completedCount = 0;

        List<Map<String, Object>> formattedTransactions = new ArrayList<>();

        if (transactions != null) {
            for (FinancialTransaction t : transactions) {
                if ("SUCCESS".equalsIgnoreCase(t.getStatus())) {
                    totalRevenue = totalRevenue.add(t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO);
                    completedCount++;
                } else if ("REFUNDED".equalsIgnoreCase(t.getStatus())) {
                    totalRefunds = totalRefunds.add(t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO);
                }

                Map<String, Object> item = new HashMap<>();
                item.put("id", "TXN-" + t.getId());
                item.put("bookingId", t.getBookingId() != null ? t.getBookingId() : 0);
                item.put("userName", t.getUserName() != null ? t.getUserName() : "會員");
                item.put("courtName", t.getCourtName() != null ? t.getCourtName() : "網球場");
                item.put("amount", t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO);
                item.put("paymentMethod", t.getPaymentMethod() != null ? t.getPaymentMethod() : "CASH");
                item.put("status", t.getStatus() != null ? t.getStatus() : "SUCCESS");
                item.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
                formattedTransactions.add(item);
            }
        }

        BigDecimal averageOrderValue = completedCount > 0
                ? totalRevenue.divide(BigDecimal.valueOf(completedCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRevenue", totalRevenue);
        summary.put("revenueGrowth", 0);
        summary.put("totalRefunds", totalRefunds);
        summary.put("completedBookingsCount", completedCount);
        summary.put("averageOrderValue", averageOrderValue);

        Map<String, Object> response = new HashMap<>();
        response.put("summary", summary);
        response.put("transactions", formattedTransactions);

        return response;
    }
}
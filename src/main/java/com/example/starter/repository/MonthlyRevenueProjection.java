package com.example.starter.repository;
public interface MonthlyRevenueProjection {
    String getYearMonth();     // 月份 (格式: YYYY-MM)
    Integer getTotalRevenue(); // 該月總營收金額 (加總 totalFee)
    Long getTotalBookings();   // 該月有效預約筆數
}

package com.example.starter.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyRevenueDTO {
    private String yearMonth;     // 月份 (格式: YYYY-MM)
    private Integer totalRevenue; // 總營業額
    private Long totalBookings;   // 預約總筆數
}

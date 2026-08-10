package com.example.starter.repository;
import com.example.starter.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {

    // 依預約 ID 查詢財務紀錄
    List<FinancialTransaction> findByBookingId(Long bookingId);

    // 依狀態查詢（例如查詢所有 SUCCESS 或 REFUNDED）
    List<FinancialTransaction> findByStatus(String status);
}

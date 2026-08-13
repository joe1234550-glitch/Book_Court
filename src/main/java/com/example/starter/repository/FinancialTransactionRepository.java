package com.example.starter.repository;
import com.example.starter.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {

    // 🎯 1. 僅依時間區間查詢（用於「全部支付方式」）
    List<FinancialTransaction> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    // 🎯 2. 依時間區間 + 指定支付方式查詢
    List<FinancialTransaction> findByCreatedAtBetweenAndPaymentMethodOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end, String paymentMethod);
}

package com.example.starter.repository;


import com.example.starter.entity.OperationLogRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationLogRepository extends JpaRepository<OperationLogRecord, Long> {
}
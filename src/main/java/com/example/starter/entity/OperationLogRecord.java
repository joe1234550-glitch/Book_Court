package com.example.starter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "operation_log")
@Getter
@Setter   // Aspect 裡會呼叫 record.setModule(...) 等 setter，一定要有 Lombok 註解
public class OperationLogRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String module;        // 操作模組
    private String action;        // 操作類型
    private String description;   // 操作描述
    private String methodName;    // 方法全名
    private String params;        // 方法參數（JSON 格式）
    private String result;        // 回傳值（JSON 格式）
    private String errorMessage;  // 例外訊息
    private String operatorId;    // 操作者 ID
    private String operatorName;  // 操作者名稱
    private Long costMillis;      // 執行耗時（毫秒）
    private Boolean success;      // 是否成功
    private LocalDateTime createdAt; // 記錄時間
}

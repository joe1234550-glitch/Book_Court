package com.example.starter.annotation;
import java.lang.annotation.*;

/**
 * 效能監控註解
 * 標記在方法上，超過閾值時自動發出警告日誌
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PerformanceMonitor {
    /**
     * 警告閾值（毫秒）
     * 方法執行時間超過此值時，輸出 WARN 等級日誌
     */
    long threshold() default 1000L;

    /**
     * 是否記錄詳細參數（預設關閉，避免敏感資料洩漏）
     */
    boolean logParams() default false;
}

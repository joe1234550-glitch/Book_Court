package com.example.starter.aspect;
import com.example.starter.annotation.PerformanceMonitor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * 效能監控切面
 * 監控方法執行時間，超過閾值時發出警告
 */
@Aspect
@Component
@Slf4j
public class PerformanceMonitorAspect {

    @Around("@annotation(performanceMonitor)")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint,
                                     PerformanceMonitor performanceMonitor) throws Throwable {

        String methodName = joinPoint.getSignature().toShortString();
        long threshold = performanceMonitor.threshold();

        // 記錄開始時間（使用 nanoTime 取得更精確的時間）
        long startNano = System.nanoTime();

        try {
            Object result = joinPoint.proceed(); // 執行目標方法
            long costMillis = (System.nanoTime() - startNano) / 1_000_000;

            if (costMillis > threshold) {
                // ⚠️ 超過閾值：發出警告
                if (performanceMonitor.logParams()) {
                    log.warn("⚠️ [效能警告] 方法 {} 執行耗時 {}ms，超過閾值 {}ms，參數：{}",
                            methodName, costMillis, threshold,
                            Arrays.toString(joinPoint.getArgs()));
                } else {
                    log.warn("⚠️ [效能警告] 方法 {} 執行耗時 {}ms，超過閾值 {}ms",
                            methodName, costMillis, threshold);
                }
            } else {
                // 正常情況記錄 debug 等級（不會出現在正式環境 log 中）
                log.debug("[效能監控] 方法 {} 耗時 {}ms", methodName, costMillis);
            }

            return result;

        } catch (Throwable ex) {
            long costMillis = (System.nanoTime() - startNano) / 1_000_000;
            log.error("[效能監控] 方法 {} 執行 {}ms 後拋出例外：{}",
                    methodName, costMillis, ex.getMessage());
            throw ex;
        }
    }
}

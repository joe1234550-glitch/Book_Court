package com.example.starter.exception;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

// 📋 日誌、效能監控、事務 —— 統一在切面裡管理
@Slf4j
@Aspect
@Component
public class LoggingAspect {
    @Around("execution(* com.vcb.vtuber_card_battle.service.*.*(..))")
    public Object log(ProceedingJoinPoint joinPoint) throws Throwable {
        // 統一處理所有 Service 方法的日誌
        log.info("呼叫方法：{}", joinPoint.getSignature().getName());
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        log.info("耗時：{}ms", System.currentTimeMillis() - start);
        return result;
    }
}

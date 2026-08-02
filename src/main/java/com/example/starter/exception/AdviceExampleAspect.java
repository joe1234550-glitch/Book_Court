package com.example.starter.exception;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;
@Slf4j
@Aspect
@Component
public class AdviceExampleAspect {

    // ── @Before：方法執行前 ──
    @Before("execution(* com.example.starter.service.*.*(..))")
    public void before(JoinPoint joinPoint) {
        // 此時目標方法還沒執行
        log.info("[Before] 即將執行：{}", joinPoint.getSignature().getName());
    }

    // ── @After：方法執行後（不管是否例外，類似 finally）──
    @After("execution(* com.example.starter.service.*.*(..))")
    public void after(JoinPoint joinPoint) {
        // 不管成功或失敗都會執行
        log.info("[After] 執行完畢：{}", joinPoint.getSignature().getName());
    }

    // ── @AfterReturning：正常返回後 ──
    @AfterReturning(pointcut = "execution(* com.example.starter.service.*.*(..))",
            returning = "result")  // 取得回傳值
    public void afterReturning(JoinPoint joinPoint, Object result) {
        log.info("[AfterReturning] 回傳值：{}", result);
    }

    // ── @AfterThrowing：拋出例外後 ──
    @AfterThrowing(pointcut = "execution(* com.example.starter.service.*.*(..))",
            throwing = "ex")  // 取得例外物件
    public void afterThrowing(JoinPoint joinPoint, Exception ex) {
        log.error("[AfterThrowing] 發生例外：{}", ex.getMessage());
    }

    // ── @Around：環繞（最強大，可以完全控制執行流程）──
    @Around("execution(* com.example.starter.service.*.*(..))")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        log.info("[Around] 方法開始前");
        try {
            Object result = joinPoint.proceed(); // 呼叫目標方法
            log.info("[Around] 方法正常結束");
            return result;
        } catch (Exception e) {
            log.error("[Around] 方法拋出例外：{}", e.getMessage());
            throw e; // 重新拋出，不要吃掉例外
        }
    }
}

package com.example.starter.aspect;
import com.example.starter.annotation.OperationLog;
import com.example.starter.entity.OperationLogRecord;
import com.example.starter.repository.OperationLogRepository;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

/**
 * 操作日誌切面
 * 攔截所有標有 @OperationLog 註解的方法，自動記錄操作日誌
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class OperationLogAspect {

    private final OperationLogRepository logRepository;
    private final ObjectMapper objectMapper; // 用於序列化參數和回傳值為 JSON

    /**
     * 環繞通知：攔截所有帶有 @OperationLog 註解的方法
     * 使用 @Around 是因為需要記錄執行前、執行後、例外三種情境
     */
    @Around("@annotation(operationLog)")  // 直接從參數取得註解實例（Spring 會自動綁定）
    public Object recordOperationLog(ProceedingJoinPoint joinPoint, OperationLog operationLog)
            throws Throwable {

        long startTime = System.currentTimeMillis(); // 記錄開始時間
        OperationLogRecord record = new OperationLogRecord();

        // ── 填入註解上的靜態資訊 ──
        record.setModule(operationLog.module());
        record.setAction(operationLog.action());
        record.setDescription(operationLog.description());

        // ── 填入方法資訊 ──
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        record.setMethodName(method.getDeclaringClass().getName() + "." + method.getName());

        // ── 填入方法參數（轉成 JSON） ──
        try {
            String paramsJson = objectMapper.writeValueAsString(joinPoint.getArgs());
            record.setParams(paramsJson);
        } catch (Exception e) {
            record.setParams("序列化失敗：" + e.getMessage());
        }

        // ── 取得當前登入使用者（從 Spring Security Context） ──
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                record.setOperatorId(authentication.getName());
                // 如果 Principal 是自定義 UserDetails，可以取得更多資訊
                record.setOperatorName(authentication.getName());
            }
        } catch (Exception e) {
            record.setOperatorId("unknown");
        }

        record.setCreatedAt(LocalDateTime.now());

        Object result = null;
        try {
            // ── 執行目標方法 ──
            result = joinPoint.proceed();

            // ── 記錄回傳值 ──
            try {
                record.setResult(objectMapper.writeValueAsString(result));
            } catch (Exception e) {
                record.setResult("序列化失敗：" + e.getMessage());
            }
            record.setSuccess(true);
            return result;

        } catch (Throwable ex) {
            // ── 記錄例外資訊 ──
            record.setErrorMessage(ex.getClass().getName() + ": " + ex.getMessage());
            record.setSuccess(false);
            throw ex; // 重新拋出，不要吃掉例外

        } finally {
            // ── 計算耗時並儲存（不管成功或失敗都要儲存）──
            long costMillis = System.currentTimeMillis() - startTime;
            record.setCostMillis(costMillis);

            // 非同步儲存（避免日誌記錄影響業務效能）
            saveLogAsync(record);
        }
    }

    /**
     * 非同步儲存日誌
     * 避免日誌寫入資料庫的延遲影響主要業務流程
     */
    private void saveLogAsync(OperationLogRecord record) {
        // 實際專案建議使用 @Async 或 MQ 來非同步處理
        try {
            logRepository.save(record);
        } catch (Exception e) {
            // 日誌儲存失敗不應影響業務邏輯，只記錄錯誤
            log.error("操作日誌儲存失敗：", e);
        }
    }
}

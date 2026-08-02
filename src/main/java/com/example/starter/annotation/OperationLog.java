package com.example.starter.annotation;
import java.lang.annotation.*;

/**
 * 操作日誌註解
 * 標記在方法上，AOP 切面會自動記錄此方法的操作日誌
 */
@Target(ElementType.METHOD)       // 只能標記在方法上
@Retention(RetentionPolicy.RUNTIME) // 執行期間保留（AOP 需要）
@Documented
public @interface OperationLog {
    /** 操作模組（例如：「使用者管理」） */
    String module() default "";

    /** 操作類型（例如：「新增」「刪除」「查詢」） */
    String action() default "";

    /** 操作描述 */
    String description() default "";
}

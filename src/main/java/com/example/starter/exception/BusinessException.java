package com.example.starter.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 業務邏輯例外的基底類
 * 所有預期中的業務錯誤都繼承此類
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;
    private final HttpStatus httpStatus;

    public BusinessException(ErrorCode errorCode, HttpStatus httpStatus) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public BusinessException(ErrorCode errorCode, HttpStatus httpStatus, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    // 🎯 新增 1：支援只帶訊息字串，預設 HTTP 狀態為 400 BAD_REQUEST
    public BusinessException(String customMessage) {
        super(customMessage);
        this.errorCode = null;
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }

    // 🎯 新增 2：支援帶 ErrorCode 與自訂訊息，預設 HTTP 狀態為 400 BAD_REQUEST
    public BusinessException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }
}
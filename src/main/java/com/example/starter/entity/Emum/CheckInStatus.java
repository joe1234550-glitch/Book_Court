package com.example.starter.entity.Emum;

public enum CheckInStatus {
    PENDING,      // 尚未報到
    CHECKED_IN,   // 正常完成報到
    LATE,         // 遲到報到
    NO_SHOW       // 未到場（超過時間未報到）
}

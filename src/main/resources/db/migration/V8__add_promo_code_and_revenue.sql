-- 1. 建立折扣碼主表
CREATE TABLE IF NOT EXISTS promo_codes (
                                           id            BIGSERIAL PRIMARY KEY,
                                           code          VARCHAR(50) NOT NULL UNIQUE,
    discount_amount INT NOT NULL,                  -- 折扣金額 (如折抵 100 元)
    max_uses      INT NOT NULL DEFAULT 1,          -- 可使用總次數
    used_count    INT NOT NULL DEFAULT 0,          -- 已使用次數
    start_time    TIMESTAMP NOT NULL,              -- 生效時間
    end_time      TIMESTAMP NOT NULL,              -- 截止時間
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,   -- 是否啟用
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

-- 2. 在 bookings 表新增折扣欄位
ALTER TABLE bookings
    ADD COLUMN promo_code_id BIGINT REFERENCES promo_codes(id) ON DELETE SET NULL,
    ADD COLUMN discount_amount INT NOT NULL DEFAULT 0;

-- 3. 優化報表與折扣碼檢索索引
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_bookings_created_status ON bookings(created_at, status);

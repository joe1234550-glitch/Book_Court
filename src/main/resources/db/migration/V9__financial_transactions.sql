-- 建立財務交易明細表 (Financial Transactions)
CREATE TABLE IF NOT EXISTS financial_transactions (
                                                      id             BIGSERIAL PRIMARY KEY,
                                                      booking_id     BIGINT NOT NULL,
                                                      user_name      VARCHAR(255) NOT NULL,
    court_name     VARCHAR(255) NOT NULL,
    amount         NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status         VARCHAR(50) NOT NULL,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                                 -- 外鍵約束 (與 bookings 表連動)
                                 CONSTRAINT fk_financial_transactions_booking
                                 FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
                             ON DELETE RESTRICT
    );

-- 效能優化索引
CREATE INDEX idx_financial_transactions_booking_id ON financial_transactions(booking_id);
CREATE INDEX idx_financial_transactions_created_at ON financial_transactions(created_at);

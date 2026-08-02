CREATE TABLE IF NOT EXISTS courts (
                                      id BIGSERIAL PRIMARY KEY,
                                      name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    description TEXT,
    hourly_rate INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                             );
-- 建立 bookings 預約主表
CREATE TABLE IF NOT EXISTS bookings (
                                        id          BIGSERIAL PRIMARY KEY,
                                        user_id     BIGINT        NOT NULL,
                                        court_id    BIGINT        NOT NULL,
                                        start_time  TIMESTAMP     NOT NULL,
                                        end_time    TIMESTAMP     NOT NULL,
                                        total_fee   INT           NOT NULL DEFAULT 0,
                                        status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 外鍵約束 (Foreign Keys)
    CONSTRAINT fk_bookings_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bookings_court FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE RESTRICT
    );
-- -----------------------------------------------------------------------------
-- 效能優化索引 (Indexes)
-- -----------------------------------------------------------------------------

-- 1. 優化 BookingRepository.existsOverlappingBooking(...) 複合時段查詢
-- 針對球場 ID 與時間區間建立索引，能大幅提升熱門球場高頻率搶單時的重複驗證效率
CREATE INDEX idx_bookings_court_time
    ON bookings (court_id, start_time, end_time)
    WHERE status != 'CANCELLED';

-- 2. 優化 BookingRepository.findByUserIdWithCourtAndUser(...) 查詢
CREATE INDEX idx_bookings_user_id
    ON bookings (user_id);
-- 3.建議加上索引以優化根據狀態查詢的效能 (對應 findByStatus)
CREATE INDEX idx_courts_status ON courts(status);
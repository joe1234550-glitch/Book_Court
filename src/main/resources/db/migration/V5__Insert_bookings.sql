-- 新增預約測試資料 (包含不同球場、時段與狀態)
INSERT INTO bookings (user_id, court_id, start_time, end_time, total_fee, status)
VALUES
-- 1. testuser 預約「第一球場 (硬地)」 - 已確認
(
    (SELECT id FROM users WHERE email = 'test@example.com'),
    (SELECT id FROM courts WHERE name = '第一球場 (硬地)'),
    '2026-08-03 09:00:00',
    '2026-08-03 11:00:00',
    600,
    'CONFIRMED'
),

-- 2. testuser 預約「第二球場 (硬地)」 - 待付款/處理中
(
    (SELECT id FROM users WHERE email = 'test@example.com'),
    (SELECT id FROM courts WHERE name = '第二球場 (硬地)'),
    '2026-08-03 14:00:00',
    '2026-08-03 16:00:00',
    600,
    'PENDING'
),

-- 3. testuser 預約「第三球場 (紅土)」 - 已取消
(
    (SELECT id FROM users WHERE email = 'test@example.com'),
    (SELECT id FROM courts WHERE name = '第三球場 (紅土)'),
    '2026-08-04 10:00:00',
    '2026-08-04 11:00:00',
    400,
    'CANCELLED'
);
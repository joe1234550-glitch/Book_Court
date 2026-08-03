INSERT INTO bookings (user_id, court_id, start_time, end_time, total_fee, status, is_checked_in, check_in_time, check_in_status)
VALUES
-- 1. 已正常報到到的預約
(
    (SELECT id FROM users WHERE email = 'test@example.com'),
    (SELECT id FROM courts WHERE name = '第一球場 (硬地)'),
    '2026-08-02 09:00:00',
    '2026-08-02 11:00:00',
    600,
    'CONFIRMED',
    TRUE,
    '2026-08-02 08:55:00',
    'CHECKED_IN'
),

-- 2. 尚未報到的未來預約
(
    (SELECT id FROM users WHERE email = 'test@example.com'),
    (SELECT id FROM courts WHERE name = '第二球場 (硬地)'),
    '2026-08-03 14:00:00',
    '2026-08-03 16:00:00',
    600,
    'CONFIRMED',
    FALSE,
    NULL,
    'PENDING'
),

-- 3. 未到場 (No-Show) 的歷史紀錄
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    (SELECT id FROM courts WHERE name = '第三球場 (紅土)'),
    '2026-08-01 10:00:00',
    '2026-08-01 11:00:00',
    400,
    'CONFIRMED',
    FALSE,
    NULL,
    'NO_SHOW'
);
-- 2. 新增測試使用者 (密碼皆為: password123 的 BCrypt 雜湊值)
-- 注意：不寫入 id 欄位，由 GENERATED ALWAYS AS IDENTITY 自動生成
INSERT INTO users (username, email, password, enabled) VALUES
                                                           ('testuser', 'test@example.com', '$2a$10$e8N/p.sR.x6Y4yJ0Z1c8ue9.4X93M4u5Q9/3o.s1W/8s1W', true),
                                                           ('adminuser', 'admin@example.com', '$2a$10$e8N/p.sR.x6Y4yJ0Z1c8ue9.4X93M4u5Q9/3o.s1W/8s1W', true)
    ON CONFLICT (email) DO NOTHING;

-- 3. 綁定使用者與角色關聯 (user_roles 表)
INSERT INTO user_roles (user_id, role_id) VALUES
                                              ((SELECT id FROM users WHERE email = 'test@example.com'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
                                              ((SELECT id FROM users WHERE email = 'admin@example.com'), (SELECT id FROM roles WHERE name = 'ROLE_ADMIN'))
    ON CONFLICT DO NOTHING;

-- 4. 新增球場測試資料 (對應你的 Court Entity 與 CourtType / CourtStatus)
INSERT INTO courts (name, type, status, description, hourly_rate) VALUES
                                                                      ('第一球場 (硬地)', 'HARD', 'AVAILABLE', '標準硬地網球場，附夜間照明燈具', 300),
                                                                      ('第二球場 (硬地)', 'HARD', 'AVAILABLE', '標準硬地網球場，靠近休息區', 300),
                                                                      ('第三球場 (紅土)', 'CLAY', 'AVAILABLE', '法式紅土網球場，適合滑步與高彈跳打法', 400),
                                                                      ('第四球場 (草地)', 'GRASS', 'MAINTENANCE', '草地球場（目前維護中，暫不開放）', 500)
    ON CONFLICT (name) DO NOTHING;
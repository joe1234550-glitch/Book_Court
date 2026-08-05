-- V7：修正測試帳號的預設密碼為 BCrypt 雜湊值，適用於已經存在舊 seed 的資料庫
-- 如果該使用者密碼已經是明文 password123，則更新為正確的 BCrypt hashed password

UPDATE users
SET password = '$2b$10$sqy9VNdWXkKb608waZ6bs.7/3FNkT.MrZYnQVz1BLuPkbAUXa9n4S'
WHERE email = 'test@example.com' AND password = 'password123';

UPDATE users
SET password = '$2b$10$sqy9VNdWXkKb608waZ6bs.7/3FNkT.MrZYnQVz1BLuPkbAUXa9n4S'
WHERE email = 'admin@example.com' AND password = 'password123';

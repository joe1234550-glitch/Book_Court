package com.example.starter.service;

import com.example.starter.annotation.OperationLog;
import com.example.starter.dto.UpdateUserRequest;
import com.example.starter.entity.User;
import com.example.starter.repository.RoleRepository;
import com.example.starter.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserService {
 private final UserRepository userRepository;
 private final PasswordEncoder passwordEncoder;
 private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
    }

    /**
     * 刪除使用者（敏感操作，需要記錄日誌）
     */
    @OperationLog(module = "使用者管理", action = "刪除", description = "刪除指定使用者")
    public void deleteUser(Long userId) {
        // 只需寫業務邏輯，日誌由 AOP 自動處理
        userRepository.deleteById(userId);
        log.info("使用者 {} 已刪除", userId);
    }

    /**
     * 更新使用者資料（敏感操作）
     */
    @OperationLog(module = "使用者管理", action = "修改", description = "更新使用者基本資料")
    public User updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("使用者不存在"));
        user.setUsername(request.getName());
        user.setEmail(request.getEmail());
        return userRepository.save(user);
    }

    /**
     * 查詢方法通常不需要記錄操作日誌（不加註解就不會被攔截）
     */
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow();
    }
}

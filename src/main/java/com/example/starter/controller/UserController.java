package com.example.starter.controller;
import com.example.starter.dto.UpdateUserRequest;
import com.example.starter.entity.User;
import com.example.starter.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 1. 查詢特定使用者資料 (例如：查看個人 Profile)
     * GET /api/v1/users/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * 2. 更新使用者基本資料 (修改 Username / Email)
     * PUT /api/v1/users/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {

        User updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * 3. 刪除使用者 (敏感操作，僅限管理員 ROLE_ADMIN)
     * DELETE /api/v1/users/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build(); // 回傳 204 No Content
    }
}

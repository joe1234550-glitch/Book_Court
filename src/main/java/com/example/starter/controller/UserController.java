package com.example.starter.controller;
import com.example.starter.dto.UpdateUserRequest;
import com.example.starter.entity.User;
import com.example.starter.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "4. 會員與使用者管理 API", description = "提供使用者查看與更新個人 Profile 資料，以及管理員 (ADMIN) 刪除使用者帳號功能")
@SecurityRequirement(name = "bearerAuth") // 🔒 全類別 API 皆需要 Bearer JWT Token 認證
public class UserController {

    private final UserService userService;

    /**
     * 1. 查詢特定使用者資料 (例如：查看個人 Profile)
     * GET /api/v1/users/{id}
     */
    @Operation(summary = "查詢特定使用者資料", description = "依使用者 ID 取得詳細 Profile 資料（如 Username, Email 等）")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "成功取得使用者資料"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "404", description = "找不到該使用者")
    })
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> getUserById(
            @Parameter(description = "使用者 ID", example = "1") @PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * 2. 更新使用者基本資料 (修改 Username / Email)
     * PUT /api/v1/users/{id}
     */
    @Operation(summary = "更新使用者基本資料", description = "修改指定使用者的基本資訊（如 Username 或 Email）")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "更新成功，回傳最新的使用者資料"),
            @ApiResponse(responseCode = "400", description = "請求資料格式錯誤或 Email 已被使用"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "無權限修改他人的資料"),
            @ApiResponse(responseCode = "404", description = "找不到該使用者")
    })
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> updateUser(
            @Parameter(description = "使用者 ID", example = "1") @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {

        User updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * 3. 刪除使用者 (敏感操作，僅限管理員 ROLE_ADMIN)
     * DELETE /api/v1/users/{id}
     */
    @Operation(summary = "刪除使用者帳號", description = "強制刪除指定的使用者帳號與關聯資料（僅限管理者 ROLE_ADMIN 操作）")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "刪除成功（無回傳內容）"),
            @ApiResponse(responseCode = "401", description = "未登入或 Token 已過期"),
            @ApiResponse(responseCode = "403", description = "權限不足（非管理員帳號）"),
            @ApiResponse(responseCode = "404", description = "找不到該使用者")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "使用者 ID", example = "1") @PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build(); // 回傳 204 No Content
    }
}
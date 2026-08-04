package com.example.starter.controller;

import com.example.starter.dto.*;
import com.example.starter.entity.*;
import com.example.starter.repository.*;
import com.example.starter.security.*;
import com.example.starter.service.RefreshTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

/**
 * 認證 API（模板已打通，一般情況不需要修改）：
 *   POST /api/auth/register  註冊
 *   POST /api/auth/login     登入 → 回 accessToken + refreshToken
 *   POST /api/auth/refresh   用 refreshToken 換新 token（會輪換）
 *   POST /api/auth/logout    登出（撤銷 refreshToken）
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "1. 認證管理 API", description = "提供會員註冊、帳密登入、Token 刷新與登出機制")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    @Operation(summary = "使用者登入", description = "驗證帳號密碼，成功後發放 JWT Access Token 與 Refresh Token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "登入成功，回傳 JWT 憑證"),
            @ApiResponse(responseCode = "401", description = "帳號或密碼錯誤"),
            @ApiResponse(responseCode = "403", description = "帳號已被停用")
    })
    @SecurityRequirements // 🎯 公開端點：覆蓋全域設定，不在 Swagger 畫面上要求鎖頭認證
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username(),
                            request.password()
                    )
            );

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

            String accessToken = jwtUtils.generateAccessToken(principal);

            User user = userRepository.findByUsername(principal.getUsername()).orElseThrow();
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            log.info("使用者 [{}] 登入成功", principal.getUsername());

            return ResponseEntity.ok(
                    AuthResponse.of(accessToken, refreshToken.getToken(), principal)
            );

        } catch (BadCredentialsException e) {
            log.warn("登入失敗：帳號或密碼錯誤，username={}", request.username());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @Operation(summary = "使用者註冊", description = "新增一般會員帳號，預設給予 ROLE_USER 權限")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "註冊成功"),
            @ApiResponse(responseCode = "400", description = "帳號或 Email 已被使用，或輸入資料驗證失敗")
    })
    @SecurityRequirements // 🎯 公開端點
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            return ResponseEntity.badRequest().body("此使用者名已被使用");
        }

        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body("此 Email 已被使用");
        }

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("找不到 ROLE_USER 角色，請確認 V1 migration 有跑"));

        User newUser = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .enabled(true)
                .roles(Set.of(userRole))
                .build();

        userRepository.save(newUser);

        log.info("新使用者註冊成功：{}", request.username());
        return ResponseEntity.status(HttpStatus.CREATED).body("註冊成功");
    }

    @Operation(summary = "刷新 Access Token", description = "傳入有效的 Refresh Token 換取新的 Access Token 與 Refresh Token（Token 輪換）")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "刷新成功，回傳新 Token"),
            @ApiResponse(responseCode = "400", description = "Refresh Token 無效或已過期")
    })
    @SecurityRequirements // 🎯 刷新 Token 使用的是 RequestBody 裡的 refreshToken，無須 Authorization Header
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        RefreshToken refreshToken = refreshTokenService.verifyExpiration(request.refreshToken());

        User user = refreshToken.getUser();

        UserPrincipal principal = UserPrincipal.create(user);

        String newAccessToken = jwtUtils.generateAccessToken(principal);

        // Refresh Token 輪換：每次刷新換一個新的，舊的作廢
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return ResponseEntity.ok(
                AuthResponse.of(newAccessToken, newRefreshToken.getToken(), principal)
        );
    }

    @Operation(summary = "使用者登出", description = "撤銷該使用者的 Refresh Token，使其無法再刷新 Access Token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "登出成功"),
            @ApiResponse(responseCode = "400", description = " Refresh Token 驗證失敗")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestBody RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.verifyExpiration(request.refreshToken());
        refreshTokenService.revokeAllUserTokens(refreshToken.getUser());
        return ResponseEntity.ok("登出成功");
    }
}
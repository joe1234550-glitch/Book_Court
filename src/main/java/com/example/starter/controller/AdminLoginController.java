package com.example.starter.controller;

import com.example.starter.entity.RefreshToken;
import com.example.starter.entity.User;
import com.example.starter.repository.UserRepository;
import com.example.starter.security.JwtUtils;
import com.example.starter.security.UserPrincipal;
import com.example.starter.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import java.net.URI;
import java.time.Duration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;

@Controller
@RequiredArgsConstructor
public class AdminLoginController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;

    @GetMapping("/admin/login")
    public RedirectView adminLogin() {
        return new RedirectView("/admin-login.html");
    }

    @PostMapping(value = "/admin/login", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> handleAdminLogin(
            @RequestParam String username,
            @RequestParam String password) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new IllegalStateException("找不到使用者: " + username));

                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
                String accessToken = jwtUtils.generateAccessToken(principal);

                // Set refresh token as HttpOnly secure cookie and redirect to admin dashboard
                    ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                        .httpOnly(true)
                        .secure(false) // set to true in production with HTTPS
                        .path("/")
                        .maxAge(Duration.ofDays(30))
                        .sameSite("Lax")
                        .build();

                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
                // Optionally the access token can be exchanged by the admin SPA via /api/auth/refresh
                // Redirect to backend admin UI route (stay on localhost:8080)
                headers.setLocation(URI.create("/admin/courts"));
                return new ResponseEntity<>(headers, HttpStatus.SEE_OTHER);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.TEXT_HTML)
                    .body(buildErrorPage("登入失敗：帳號或密碼錯誤。"));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .contentType(MediaType.TEXT_HTML)
                    .body(buildErrorPage("登入失敗：帳號已被停用。"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.TEXT_HTML)
                    .body(buildErrorPage("系統錯誤，請稍後再試。"));
        }
    }

    private String buildErrorPage(String message) {
        return "<!doctype html>"
                + "<html lang=\"zh-TW\">"
                + "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>管理員登入失敗</title>"
                + "<style>body{font-family:Arial,sans-serif;background:#fff5f5;color:#111827;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}"
                + ".card{width:min(580px,100%);background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(15,23,42,.08);padding:30px;}"
                + "h1{margin:0 0 16px;font-size:28px;color:#b91c1c;}p{margin:0 0 18px;color:#4b5563;line-height:1.6;}"
                + ".link{display:inline-block;margin-top:22px;color:#4f46e5;text-decoration:none;font-weight:600;}</style></head><body>"
                + "<div class=\"card\"><h1>登入失敗</h1>"
                + "<p>" + message + "</p>"
                + "<a class=\"link\" href=\"/admin/login\">返回管理員登入頁</a>"
                + "</div></body></html>";
    }
}

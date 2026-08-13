package com.example.starter.config;

import com.example.starter.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // 啟用 @PreAuthorize 等方法層級註解
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // 🎯 0. 放行所有 OPTIONS 預檢請求（解決前端跨域探路請求被擋的問題）
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ── 1. 認證與公開 API 放行 ─────────────────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()          // 註冊 / 登入 / refresh / 登出
                        .requestMatchers("/api/example/public").permitAll()   // 示範用公開端點

                        // 🎯 2. Swagger / OpenAPI 3 UI 靜態資源放行 ─────────────────────
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml"
                        ).permitAll()

                        // 🎾 3. 網球預約系統專屬權限規則 ──────────────────────────────────
                        // (A) 球場公開 API：任何人（包含未登入）都可以查詢球場列表與細節
                        .requestMatchers(HttpMethod.GET, "/api/v1/courts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/bookings/court/**").permitAll()
                        .requestMatchers("/admin/login", "/admin-login.html").permitAll()

                        // 🎯 (B) 管理員專屬 API：改用 hasAnyAuthority 相容 "ADMIN" 與 "ROLE_ADMIN" 兩者
                        .requestMatchers("/api/v1/admin/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")   // 所有 /api/v1/admin/ 開頭的管理者端點
                        .requestMatchers("/v1/admin/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")       // 兼顧舊路徑
                        .requestMatchers(HttpMethod.POST, "/api/v1/courts/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/courts/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/users/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")

                        // ── 4. 其他所有請求都需要登入（保持在最後一條） ──────────────────
                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Spring Security 7（Boot 4）用建構子注入 UserDetailsService。
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // 1. 精準允許前端 Vite (5173) 與 Localhost 來源
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173"
        ));
        // 2. 允許所有 HTTP 動作 (包含 OPTIONS 預檢)
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // 3. 允許攜帶 Authorization Header
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

}

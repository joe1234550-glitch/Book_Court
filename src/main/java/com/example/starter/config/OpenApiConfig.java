package com.example.starter.config;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "網球預約系統 API",
                version = "v1.0.0",
                description = "提供球場預約、報到、會員與認證管理的 RESTful API",
                contact = @Contact(name = "後端團隊", email = "backend@example.com")
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "本地開發環境"),
                @Server(url = "https://api.example.com", description = "正式環境")
        },
        // 🎯 關鍵補強：全域套用下方定義的 bearerAuth 認證機制
        // 這樣 Swagger UI 才會出現 Authorize 解鎖按鈕，並對 API 進行帶 Token 測試
        security = @SecurityRequirement(name = "bearerAuth")
)
// 定義 JWT Bearer Token 認證方式
@SecurityScheme(
        name = "bearerAuth", // 與上面 security 的 name 保持一致
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenApiConfig {
        // 採用純註解配置，內部保持空白即可
}

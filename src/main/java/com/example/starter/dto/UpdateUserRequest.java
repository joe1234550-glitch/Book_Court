package com.example.starter.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
        @NotBlank
        private String name;

        @NotBlank
        @Email
        private String email;

        private boolean enabled;

        private List<String> roles;
}


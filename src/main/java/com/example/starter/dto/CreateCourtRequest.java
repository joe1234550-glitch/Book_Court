package com.example.starter.dto;
import com.example.starter.entity.Emum.CourtStatus;
import com.example.starter.entity.Emum.CourtType;
import lombok.Data;

@Data
public class CreateCourtRequest {
    private String name;
    private CourtType type;
    private CourtStatus status;
    private String description;
    private Integer hourlyRate; // 或是 BigDecimal / Double，需與欄位型別一致
}

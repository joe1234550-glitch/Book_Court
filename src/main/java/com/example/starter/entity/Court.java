package com.example.starter.entity;

import com.example.starter.entity.Emum.CourtStatus;
import com.example.starter.entity.Emum.CourtType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "courts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Court {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourtType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CourtStatus status = CourtStatus.AVAILABLE;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "hourly_rate", nullable = false)
    private Integer hourlyRate;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

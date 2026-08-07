package com.example.starter.entity;
import com.example.starter.entity.Emum.CheckInStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "total_fee", nullable = false)
    private Integer totalFee;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_checked_in", nullable = false)
    @Builder.Default
    private boolean checkedIn = false; // 是否已完成報到

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime; // 實際報到時間點

    @Enumerated(EnumType.STRING)
    @Column(name = "check_in_status", nullable = false, length = 20)
    @Builder.Default
    private CheckInStatus checkInStatus = CheckInStatus.PENDING; // 報到狀態細分

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promo_code_id")
    private PromoCode promoCode;

    @Column(name = "discount_amount")
    private Integer discountAmount = 0;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 執行現場報到動作
     */
    public void markAsCheckedIn() {
        this.checkedIn = true;
        this.checkInTime = LocalDateTime.now();

        // 範例：如果報到時間超過預約開始時間 15 分鐘，標示為遲到
        if (this.checkInTime.isAfter(this.startTime.plusMinutes(15))) {
            this.checkInStatus = CheckInStatus.LATE;
        } else {
            this.checkInStatus = CheckInStatus.CHECKED_IN;
        }
    }

}

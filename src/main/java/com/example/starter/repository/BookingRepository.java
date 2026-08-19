package com.example.starter.repository;

import com.example.starter.entity.Booking;
import com.example.starter.entity.Emum.CheckInStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // 1. 解決 N+1：一口氣 JOIN FETCH 載入關聯的 Court 與 User
    @Query("SELECT b FROM Booking b JOIN FETCH b.court JOIN FETCH b.user WHERE b.user.id = :userId ORDER BY b.startTime DESC")
    List<Booking> findByUserIdWithCourtAndUser(@Param("userId") Long userId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.court JOIN FETCH b.user WHERE b.id = :bookingId")
    Optional<Booking> findByIdWithDetails(@Param("bookingId") Long bookingId);

    // 2. 核心預約防重疊驗證 (僅針對有效預約狀態進行比對，並支援排除自身 ID)
    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
            "WHERE b.court.id = :courtId " +
            "AND b.status IN ('PENDING', 'CONFIRMED', 'COMPLETED') " +
            "AND (:startTime < b.endTime AND :endTime > b.startTime) " +
            "AND (:excludeBookingId IS NULL OR b.id != :excludeBookingId)")
    boolean existsOverlappingBooking(
            @Param("courtId") Long courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeBookingId") Long excludeBookingId
    );

    @Query("SELECT b FROM Booking b JOIN FETCH b.user WHERE b.court.id = :courtId " +
            "AND b.startTime >= :dayStart AND b.startTime < :dayEnd " +
            "AND b.status IN ('PENDING', 'CONFIRMED') ORDER BY b.startTime")
    List<Booking> findByCourtAndDay(
            @Param("courtId") Long courtId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd
    );

    // 3. 查詢特定球場當天的指定報到狀態
    @Query("SELECT b FROM Booking b JOIN FETCH b.user WHERE b.court.id = :courtId " +
            "AND b.startTime >= :dayStart AND b.startTime < :dayEnd " +
            "AND b.checkInStatus = :checkInStatus")
    List<Booking> findByCourtAndCheckInStatus(
            @Param("courtId") Long courtId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd,
            @Param("checkInStatus") CheckInStatus checkInStatus
    );

    // 4. 統計使用者的爽約 (NO_SHOW) 次數
    long countByUserIdAndCheckInStatus(Long userId, CheckInStatus checkInStatus);

    // 計算指定球場是否有任何預約
    long countByCourtId(Long courtId);

    // 5. ADMIN 收益報表查詢（按月統計已確認/已完成的預約營收）
    @Query("SELECT " +
            "  FUNCTION('TO_CHAR', b.startTime, 'YYYY-MM') AS yearMonth, " +
            "  SUM(b.totalFee) AS totalRevenue, " +
            "  COUNT(b.id) AS totalBookings " +
            "FROM Booking b " +
            "WHERE b.status IN ('CONFIRMED', 'COMPLETED') " +
            "GROUP BY FUNCTION('TO_CHAR', b.startTime, 'YYYY-MM') " +
            "ORDER BY yearMonth DESC")
    List<MonthlyRevenueProjection> findMonthlyRevenueReport();
    // 2. 新增 3 參數的便利方法（自動傳入 null）
    default boolean existsOverlappingBooking(Long courtId, LocalDateTime startTime, LocalDateTime endTime) {
        return existsOverlappingBooking(courtId, startTime, endTime, null);
    }
}
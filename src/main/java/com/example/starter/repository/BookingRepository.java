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

    // 2. 核心預約防重疊驗證 (僅針對有效預約狀態進行比對)
    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
            "WHERE b.court.id = :courtId " +
            "AND b.status IN ('PENDING', 'CONFIRMED') " +
            "AND (:startTime < b.endTime AND :endTime > b.startTime)")
    boolean existsOverlappingBooking(
            @Param("courtId") Long courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    // 3. 🎯 (連動新欄位) 查詢特定球場當天的指定報到狀態 (用於櫃檯報到看板/排程清理)
    @Query("SELECT b FROM Booking b JOIN FETCH b.user WHERE b.court.id = :courtId " +
            "AND b.startTime >= :dayStart AND b.startTime < :dayEnd " +
            "AND b.checkInStatus = :checkInStatus")
    List<Booking> findByCourtAndCheckInStatus(
            @Param("courtId") Long courtId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd,
            @Param("checkInStatus") CheckInStatus checkInStatus
    );

    // 4. 🎯 (連動新欄位) 統計使用者的爽約 (NO_SHOW) 次數，方便做黑名單機制
    long countByUserIdAndCheckInStatus(Long userId, CheckInStatus checkInStatus);
}
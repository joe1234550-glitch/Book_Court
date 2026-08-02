package com.example.starter.repository;

import com.example.starter.entity.Booking;
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
    @Query("SELECT b FROM Booking b JOIN FETCH b.court JOIN FETCH b.user WHERE b.user.id = :userId")
    List<Booking> findByUserIdWithCourtAndUser(@Param("userId") Long userId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.court JOIN FETCH b.user WHERE b.id = :bookingId")
    Optional<Booking> findByIdWithDetails(@Param("bookingId") Long bookingId);

    // 2. 核心預約防重疊驗證 (Overlapping Time Window Check)
    // 條件：同一球場、狀態不為 CANCELLED、且請求時間與現有預約有交集
    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
            "WHERE b.court.id = :courtId " +
            "AND b.status != 'CANCELLED' " +
            "AND (:startTime < b.endTime AND :endTime > b.startTime)")
    boolean existsOverlappingBooking(
            @Param("courtId") Long courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}

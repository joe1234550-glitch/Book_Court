package com.example.starter.service;
import com.example.starter.dto.BookingResponse;
import com.example.starter.dto.CreateBookingRequest;
import com.example.starter.entity.Booking;
import com.example.starter.entity.Court;
import com.example.starter.entity.User;
import com.example.starter.repository.BookingRepository;
import com.example.starter.repository.CourtRepository;
import com.example.starter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;

    // 1. 發起預約
    @Transactional
    public BookingResponse createBooking(Long userId, CreateBookingRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("預約時間無效：開始時間必須早於結束時間且不得為過去時間");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("找不到使用者 ID: " + userId));

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new RuntimeException("找不到球場 ID: " + request.getCourtId()));

        // 防重疊檢查
        boolean isOverlapped = bookingRepository.existsOverlappingBooking(request.getCourtId(), request.getStartTime(), request.getEndTime());
        if (isOverlapped) {
            throw new IllegalStateException("該時段已有其他預約，請選擇其他時間");
        }

        // 費用計算
        long hours = (long) Math.ceil((double) Duration.between(request.getStartTime(), request.getEndTime()).toMinutes() / 60.0);
        int totalFee = (int) (hours * court.getHourlyRate());

        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .totalFee(totalFee)
                .status("CONFIRMED") // 建議預設直接是 CONFIRMED 或經由付款改為 CONFIRMED
                .build();

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.fromEntity(saved);
    }

    // 2. 查詢當前使用者的預約紀錄
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserIdWithCourtAndUser(userId)
                .stream()
                .map(BookingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 3. 🎯 執行現場報到 (核心新增功能)
    @Transactional
    public BookingResponse checkInBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("找不到預約紀錄 ID: " + bookingId));

        if (booking.isCheckedIn()) {
            throw new IllegalStateException("該筆預約已經完成報到，請勿重複報到");
        }

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new IllegalStateException("該預約已取消，無法進行報到");
        }

        // 呼叫 Booking Entity 的領域邏輯方法
        booking.markAsCheckedIn();

        return BookingResponse.fromEntity(booking);
    }

    // 4. 取消預約 (邏輯強化)
    @Transactional
    public void cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("找不到預約紀錄 ID: " + bookingId));

        // 檢查權限：只有本人或管理員可以取消 (此處範例為本人)
        if (!booking.getUser().getId().equals(userId)) {
            throw new SecurityException("您無權取消此預約");
        }

        if (booking.isCheckedIn()) {
            throw new IllegalStateException("已完成報到的預約無法取消");
        }

        if (LocalDateTime.now().isAfter(booking.getStartTime())) {
            throw new IllegalStateException("預約時段已開始或已過期，無法取消");
        }

        booking.setStatus("CANCELLED");
    }
}

package com.example.starter.service;
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

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;

    // 發起預約 (包含時段重疊檢查與費用試算)
    @Transactional
    public Booking createBooking(Long userId, Long courtId, LocalDateTime startTime, LocalDateTime endTime) {
        // 1. 時間合法性檢驗
        if (startTime.isAfter(endTime) || startTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("預約時間無效：開始時間必須早於結束時間且不得為過去時間");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("找不到使用者 ID: " + userId));

        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new RuntimeException("找不到球場 ID: " + courtId));

        // 2. 防重疊檢查
        boolean isOverlapped = bookingRepository.existsOverlappingBooking(courtId, startTime, endTime);
        if (isOverlapped) {
            throw new IllegalStateException("該時段已有其他預約，請選擇其他時間");
        }

        // 3. 費用計算 (以小時為單位，不足一小時按比例進位)
        long hours = (long) Math.ceil((double) Duration.between(startTime, endTime).toMinutes() / 60.0);
        int totalFee = (int) (hours * court.getHourlyRate());

        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .startTime(startTime)
                .endTime(endTime)
                .totalFee(totalFee)
                .status("PENDING")
                .build();

        return bookingRepository.save(booking);
    }

    // 查詢特定使用者的預約紀錄 (JOIN FETCH 防範 N+1)
    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserIdWithCourtAndUser(userId);
    }

    // 取消預約 (使用者或管理員)
    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("找不到預約紀錄 ID: " + bookingId));

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
    }
}

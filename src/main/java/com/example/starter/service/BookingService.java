package com.example.starter.service;

import com.example.starter.dto.BookingResponse;
import com.example.starter.dto.CreateBookingRequest;
import com.example.starter.dto.MonthlyRevenueDTO;
import com.example.starter.entity.Booking;
import com.example.starter.entity.Court;
import com.example.starter.entity.PromoCode;
import com.example.starter.entity.User;
import com.example.starter.exception.BusinessException;
import com.example.starter.repository.BookingRepository;
import com.example.starter.repository.CourtRepository;
import com.example.starter.repository.PromoCodeRepository;
import com.example.starter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;
    private final PromoCodeRepository promoCodeRepository; // 🎯 注入 PromoCodeRepository

    // 1. 發起預約 (整合折扣碼功能)
    @Transactional
    public BookingResponse createBooking(Long userId, CreateBookingRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("預約時間無效：開始時間必須早於結束時間且不得為過去時間");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("找不到使用者 ID: " + userId));

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new BusinessException("找不到球場 ID: " + request.getCourtId()));

        // 防重疊檢查
        boolean isOverlapped = bookingRepository.existsOverlappingBooking(request.getCourtId(), request.getStartTime(), request.getEndTime());
        if (isOverlapped) {
            throw new IllegalStateException("該時段已有其他預約，請選擇其他時間");
        }

        // 🎯 1. 計算原價
        int originalFee = calculateFee(request.getStartTime(), request.getEndTime(), court.getHourlyRate());
        int discountAmount = 0;
        PromoCode promoCode = null;

        // 🎯 2. 驗證並扣減折扣碼
        if (StringUtils.hasText(request.getPromoCode())) {
            promoCode = promoCodeRepository.findByCode(request.getPromoCode())
                    .orElseThrow(() -> new BusinessException("無效的折扣碼"));

            LocalDateTime now = LocalDateTime.now();
            if (!promoCode.getEnabled() || now.isBefore(promoCode.getStartTime()) || now.isAfter(promoCode.getEndTime())) {
                throw new BusinessException("折扣碼已過期或未生效");
            }
            if (promoCode.getUsedCount() >= promoCode.getMaxUses()) {
                throw new BusinessException("折扣碼已達使用次數上限");
            }

            discountAmount = promoCode.getDiscountAmount();
            promoCode.setUsedCount(promoCode.getUsedCount() + 1); // 增加使用次數
        }

        // 🎯 3. 計算折抵後最終應付金額 (避免負數)
        int finalFee = Math.max(0, originalFee - discountAmount);

        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .promoCode(promoCode)           // 存入關聯 PromoCode Entity
                .discountAmount(discountAmount) // 存入折抵金額
                .totalFee(finalFee)             // 存入實際應付總額
                .status("CONFIRMED")
                .build();

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.fromEntity(saved);
    }

    // 🎯 輔助方法：計算時數費用
    private int calculateFee(LocalDateTime startTime, LocalDateTime endTime, Integer hourlyRate) {
        long hours = (long) Math.ceil((double) Duration.between(startTime, endTime).toMinutes() / 60.0);
        return (int) (hours * hourlyRate);
    }

    // 2. 查詢當前使用者的預約紀錄
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserIdWithCourtAndUser(userId)
                .stream()
                .map(BookingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByCourtAndDate(Long courtId, LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        return bookingRepository.findByCourtAndDay(courtId, dayStart, dayEnd)
                .stream()
                .map(BookingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 3. 執行現場報到
    @Transactional
    public BookingResponse checkInBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("找不到預約紀錄 ID: " + bookingId));

        if (booking.isCheckedIn()) {
            throw new IllegalStateException("該筆預約已經完成報到，請勿重複報到");
        }

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new IllegalStateException("該預約已取消，無法進行報到");
        }

        booking.markAsCheckedIn();
        return BookingResponse.fromEntity(booking);
    }

    // 4. 取消預約
    @Transactional
    public void cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("找不到預約紀錄 ID: " + bookingId));

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

    // 🎯 5. 新增 ADMIN 營收報表功能
    @Transactional(readOnly = true)
    public List<MonthlyRevenueDTO> getMonthlyRevenueReport() {
        return bookingRepository.findMonthlyRevenueReport()
                .stream()
                .map(p -> new MonthlyRevenueDTO(
                        p.getYearMonth(),
                        p.getTotalRevenue() != null ? p.getTotalRevenue() : 0,
                        p.getTotalBookings() != null ? p.getTotalBookings() : 0L
                ))
                .collect(Collectors.toList());
    }
}

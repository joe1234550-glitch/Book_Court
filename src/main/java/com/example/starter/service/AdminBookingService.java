package com.example.starter.service;

import com.example.starter.dto.BookingResponse;
import com.example.starter.dto.CheckoutRequest;
import com.example.starter.dto.CreateBookingRequest;
import com.example.starter.entity.*;
import com.example.starter.exception.BusinessException;
import com.example.starter.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class AdminBookingService {

    private final BookingRepository bookingRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;
    private final PromoCodeRepository promoCodeRepository;
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(BookingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 🎯 1. 現場結帳
    @Transactional
    public BookingResponse checkoutBooking(Long bookingId, CheckoutRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("找不到預約紀錄 ID: " + bookingId));

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new BusinessException("該預約已取消，無法結帳");
        }
        if ("COMPLETED".equals(booking.getStatus())) {
            throw new BusinessException("該預約已完成結帳，請勿重複結帳");
        }

        // 更新狀態
        booking.setStatus("COMPLETED");

        // 🎯 轉型關鍵：若前端沒傳實收金額，則將 Booking 中的 Integer totalFee 轉為 BigDecimal
        BigDecimal finalAmount = (request != null && request.getAmount() != null)
                ? request.getAmount()
                : (booking.getTotalFee() != null ? BigDecimal.valueOf(booking.getTotalFee()) : BigDecimal.ZERO);

        String paymentMethod = (request != null && request.getPaymentMethod() != null)
                ? request.getPaymentMethod()
                : "CASH";

        // 寫入財務記帳明細
        FinancialTransaction transaction = FinancialTransaction.builder()
                .bookingId(booking.getId())
                .userName(booking.getUser().getUsername())
                .courtName(booking.getCourt().getName())
                .amount(finalAmount)
                .paymentMethod(paymentMethod)
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build();
        financialTransactionRepository.save(transaction);

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.fromEntity(saved);
    }

    // 🎯 2. 現場退費 (防下雨等天候因素)
    @Transactional
    public BookingResponse refundBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("找不到預約紀錄 ID: " + bookingId));

        if (!"COMPLETED".equals(booking.getStatus())) {
            throw new BusinessException("僅有已結帳(COMPLETED)的預約才能辦理退費");
        }

        // 更新狀態為 REFUNDED
        booking.setStatus("REFUNDED");

        // 返還折扣碼使用次數
        if (booking.getPromoCode() != null) {
            PromoCode promoCode = booking.getPromoCode();
            if (promoCode.getUsedCount() != null && promoCode.getUsedCount() > 0) {
                promoCode.setUsedCount(promoCode.getUsedCount() - 1);
            }
        }

        // 🎯 轉型關鍵：將 Integer totalFee 轉為 BigDecimal
        BigDecimal refundAmount = booking.getTotalFee() != null
                ? BigDecimal.valueOf(booking.getTotalFee())
                : BigDecimal.ZERO;

        // 寫入財務退款流水帳
        FinancialTransaction refundTransaction = FinancialTransaction.builder()
                .bookingId(booking.getId())
                .userName(booking.getUser().getUsername())
                .courtName(booking.getCourt().getName())
                .amount(refundAmount)
                .paymentMethod("CASH")
                .status("REFUNDED")
                .createdAt(LocalDateTime.now())
                .build();
        financialTransactionRepository.save(refundTransaction);

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.fromEntity(saved);
    }

    // 🎯 3. 管理員發起預約
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        // 1. 強制清理秒數與毫秒（精確到分，避免 15:00:00 與 15:00:01 導致重疊判定失敗或壓線過期）
        LocalDateTime startTime = request.getStartTime().withSecond(0).withNano(0);
        LocalDateTime endTime = request.getEndTime().withSecond(0).withNano(0);
        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);

        // 2. 時間合法性驗證（使用清理後的時間比對）
        if (startTime.isAfter(endTime) || startTime.isEqual(endTime) || startTime.isBefore(now)) {
            throw new BusinessException("預約時間無效：開始時間必須早於結束時間且不得為過去時間");
        }

        // 3. 尋找使用者與球場 Entity
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new BusinessException("找不到使用者 ID: " + request.getUserId()));

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new BusinessException("找不到球場 ID: " + request.getCourtId()));

        // 4. 防重疊檢查（帶入清理後的 startTime, endTime，且第四個參數傳 null 表示不排除任何預約 ID）
        boolean isOverlapped = bookingRepository.existsOverlappingBooking(
                request.getCourtId(),
                startTime,
                endTime,
                null
        );
        if (isOverlapped) {
            throw new BusinessException("該時段已有其他預約，請選擇其他時間");
        }

        // 5. 計算原價
        int originalFee = calculateFee(startTime, endTime, court.getHourlyRate());
        int discountAmount = 0;
        PromoCode promoCode = null;

        // 6. 驗證並扣減折扣碼
        if (StringUtils.hasText(request.getPromoCode())) {
            promoCode = promoCodeRepository.findByCode(request.getPromoCode())
                    .orElseThrow(() -> new BusinessException("無效的折扣碼"));

            LocalDateTime promoNow = LocalDateTime.now();
            if (!promoCode.getEnabled() || promoNow.isBefore(promoCode.getStartTime()) || promoNow.isAfter(promoCode.getEndTime())) {
                throw new BusinessException("折扣碼已過期或未生效");
            }
            if (promoCode.getUsedCount() >= promoCode.getMaxUses()) {
                throw new BusinessException("折扣碼已達使用次數上限");
            }

            discountAmount = promoCode.getDiscountAmount();
            promoCode.setUsedCount(promoCode.getUsedCount() + 1); // 增加使用次數
        }

        // 7. 計算折抵後最終應付金額 (避免負數)
        int finalFee = Math.max(0, originalFee - discountAmount);

        // 8. 建立新預約 Entity
        Booking booking = Booking.builder()
                .user(user)
                .court(court)
                .startTime(startTime)          // 存入清理後的時間
                .endTime(endTime)              // 存入清理後的時間
                .promoCode(promoCode)           // 存入關聯 PromoCode Entity
                .discountAmount(discountAmount) // 存入折抵金額
                .totalFee(finalFee)             // 存入實際應付總額
                .status("CONFIRMED")
                .createdAt(LocalDateTime.now())
                .build();

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.fromEntity(saved);
    }

    // 🎯 輔助方法：計算時數費用 (與 BookingService 對齊)
    private int calculateFee(LocalDateTime startTime, LocalDateTime endTime, Integer hourlyRate) {
        long hours = (long) Math.ceil((double) Duration.between(startTime, endTime).toMinutes() / 60.0);
        return (int) (hours * hourlyRate);
    }
}

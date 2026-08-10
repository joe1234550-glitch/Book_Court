package com.example.starter.service;

import com.example.starter.dto.BookingResponse;
import com.example.starter.dto.CheckoutRequest;
import com.example.starter.entity.Booking;
import com.example.starter.entity.FinancialTransaction;
import com.example.starter.entity.PromoCode;
import com.example.starter.exception.BusinessException;
import com.example.starter.repository.BookingRepository;
import com.example.starter.repository.FinancialTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class AdminBookingService {

    private final BookingRepository bookingRepository;
    private final FinancialTransactionRepository financialTransactionRepository;

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
}

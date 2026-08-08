package com.example.starter.service;

import com.example.starter.entity.PromoCode;
import com.example.starter.exception.BusinessException;
import com.example.starter.repository.PromoCodeRepository;
import lombok.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    public PromoCode validatePromoCode(String code) {
        PromoCode promoCode = promoCodeRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException("無效的折扣碼"));

        LocalDateTime now = LocalDateTime.now();
        if (!promoCode.getEnabled() || now.isBefore(promoCode.getStartTime()) || now.isAfter(promoCode.getEndTime())) {
            throw new BusinessException("折扣碼已過期或未生效");
        }
        if (promoCode.getUsedCount() >= promoCode.getMaxUses()) {
            throw new BusinessException("折扣碼已達使用次數上限");
        }

        return promoCode;
    }
}

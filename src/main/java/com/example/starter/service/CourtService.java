package com.example.starter.service;
import com.example.starter.entity.Court;
import com.example.starter.entity.Emum.CourtStatus;
import com.example.starter.repository.CourtRepository;
import com.example.starter.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourtService {

    private final CourtRepository courtRepository;

    // 1. [前台] 取得所有開放中 (AVAILABLE) 的球場
    @Transactional(readOnly = true)
    public List<Court> getAvailableCourts() {
        return courtRepository.findByStatus(CourtStatus.AVAILABLE);
    }

    // 2. 依 ID 取得單一球場細節
    @Transactional(readOnly = true)
    public Court getCourtById(Long id) {
        return courtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到球場 ID: " + id));
    }
}

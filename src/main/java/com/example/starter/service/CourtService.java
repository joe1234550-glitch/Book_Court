package com.example.starter.service;
import com.example.starter.entity.Court;
import com.example.starter.entity.Emum.CourtStatus;
import com.example.starter.repository.CourtRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourtService {

    private final CourtRepository courtRepository;

    // 取得所有開放中的球場
    @Transactional(readOnly = true)
    public List<Court> getAvailableCourts() {
        return courtRepository.findByStatus(CourtStatus.AVAILABLE);
    }

    // 取得所有球場 (管理員)
    @Transactional(readOnly = true)
    public List<Court> getAllCourts() {
        return courtRepository.findAll();
    }

    // 依 ID 取得球場
    @Transactional(readOnly = true)
    public Court getCourtById(Long id) {
        return courtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到球場 ID: " + id));
    }

    // 新增球場 (管理員)
    @Transactional
    public Court createCourt(Court court) {
        if (courtRepository.existsByName(court.getName())) {
            throw new IllegalArgumentException("已有相同名稱的球場：" + court.getName());
        }
        return courtRepository.save(court);
    }

    // 更新球場狀態 (例如改為 MAINTENANCE 維修中)
    @Transactional
    public Court updateCourtStatus(Long courtId, CourtStatus status) {
        Court court = getCourtById(courtId);
        court.setStatus(status);
        return courtRepository.save(court);
    }
}

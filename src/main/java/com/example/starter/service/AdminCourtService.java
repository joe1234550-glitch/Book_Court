package com.example.starter.service;

import com.example.starter.dto.CreateCourtRequest;
import com.example.starter.entity.Court;
import com.example.starter.entity.Emum.CourtStatus;
import com.example.starter.repository.BookingRepository;
import com.example.starter.repository.CourtRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminCourtService {

    private final CourtRepository courtRepository;
    private final BookingRepository bookingRepository;

    // 1. [後台] 取得所有球場 (包含維修中、關閉等)
    @Transactional(readOnly = true)
    public List<Court> getAllCourts() {
        return courtRepository.findAll();
    }

    // 2. [後台] 新增球場
    @Transactional
    public Court createCourt(CreateCourtRequest req) {
        if (courtRepository.existsByName(req.getName())) {
            throw new IllegalArgumentException("已有相同名稱的球場：" + req.getName());
        }

        Court court = new Court();
        court.setName(req.getName());
        court.setType(req.getType());
        court.setStatus(req.getStatus());
        court.setDescription(req.getDescription());
        court.setHourlyRate(req.getHourlyRate());

        return courtRepository.save(court);
    }

    // 3. [後台] 更新球場狀態
    @Transactional
    public Court updateCourtStatus(Long courtId, CourtStatus status) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new RuntimeException("找不到球場 ID: " + courtId));
        court.setStatus(status);
        return courtRepository.save(court);
    }

    // 4. [後台] 刪除球場（若已有預約紀錄則拒絕刪除）
    @Transactional
    public void deleteCourt(Long courtId) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new RuntimeException("找不到球場 ID: " + courtId));
        long cnt = bookingRepository.countByCourtId(courtId);
        if (cnt > 0) {
            throw new IllegalStateException("此球場已有預約紀錄，無法刪除");
        }
        courtRepository.deleteById(courtId);
    }
}

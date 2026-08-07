package com.example.starter.repository;
import com.example.starter.entity.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {

    // 根據折扣碼字串查詢
    Optional<PromoCode> findByCode(String code);

    // 檢查折扣碼是否存在
    boolean existsByCode(String code);
}

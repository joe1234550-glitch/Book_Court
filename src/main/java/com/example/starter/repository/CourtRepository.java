package com.example.starter.repository;

import com.example.starter.entity.Court;
import com.example.starter.entity.Emum.CourtStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourtRepository extends JpaRepository<Court, Long> {

    List<Court> findByStatus(CourtStatus status);

    boolean existsByName(String name);
}

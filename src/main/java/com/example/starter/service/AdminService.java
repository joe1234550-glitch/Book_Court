package com.example.starter.service;

import com.example.starter.dto.BookingResponse;
import com.example.starter.dto.CreateBookingRequest;
import com.example.starter.dto.CreateUserRequest;
import com.example.starter.dto.UpdateBookingRequest;
import com.example.starter.dto.UpdateUserRequest;
import com.example.starter.entity.Booking;
import com.example.starter.entity.Role;
import com.example.starter.entity.User;
import com.example.starter.exception.BusinessException;
import com.example.starter.repository.BookingRepository;
import com.example.starter.repository.CourtRepository;
import com.example.starter.repository.RoleRepository;
import com.example.starter.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CourtRepository courtRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(BookingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelBooking(Long bookingId) {
        var booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("找不到預約 ID: " + bookingId));
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
    }

    @Transactional
    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessException("此使用者名稱已被使用");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("此 Email 已被使用");
        }

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new BusinessException("找不到 ROLE_USER 角色"));

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .enabled(true)
                .roles(Set.of(userRole))
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long userId, UpdateUserRequest request) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("找不到使用者 ID: " + userId));

        // 檢查使用者名稱重複
        if (request.getName() != null && !user.getUsername().equals(request.getName())
                && userRepository.existsByUsername(request.getName())) {
            throw new BusinessException("使用者名稱已被使用");
        }

        // 檢查 Email 重複
        if (request.getEmail() != null && !user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email 已被使用");
        }

        if (request.getName() != null) user.setUsername(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        user.setEnabled(request.isEnabled());

        // 更新角色
        var roles = request.getRoles();
        if (roles != null && !roles.isEmpty()) {
            var roleEntities = roles.stream()
                    .map(r -> roleRepository.findByName(r)
                            .orElseThrow(() -> new BusinessException("找不到角色: " + r)))
                    .collect(Collectors.toSet());
            user.setRoles(roleEntities);
        }

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 管理者幫指定使用者代為預約
    @Transactional
    public BookingResponse createBooking(Long userId, CreateBookingRequest request) {
        if (userId == null) {
            throw new BusinessException("指定的使用者 ID 不能為空");
        }

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("找不到使用者 ID: " + userId));

        var court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new BusinessException("找不到球場 ID: " + request.getCourtId()));

        // 檢查時段重疊
        if (bookingRepository.existsOverlappingBooking(court.getId(), request.getStartTime(), request.getEndTime())) {
            throw new BusinessException("時段已被其他預約佔用");
        }

        var booking = Booking.builder()
                .user(user)
                .court(court)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .totalFee(0)
                .status("PENDING")
                .build();

        booking = bookingRepository.save(booking);
        return BookingResponse.fromEntity(booking);
    }

    @Transactional
    public BookingResponse updateBooking(Long bookingId, UpdateBookingRequest request) {
        var booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new BusinessException("找不到預約"));

        var court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new BusinessException("找不到球場"));

        // 修正基本型態 long 的比較 (!=)
        if (booking.getCourt().getId() != court.getId() ||
                !booking.getStartTime().equals(request.getStartTime()) ||
                !booking.getEndTime().equals(request.getEndTime())) {
            if (bookingRepository.existsOverlappingBooking(court.getId(), request.getStartTime(), request.getEndTime())) {
                throw new BusinessException("時段已被其他預約佔用");
            }
        }

        booking.setCourt(court);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        if (request.getTotalFee() != null) booking.setTotalFee(request.getTotalFee());
        if (request.getStatus() != null) booking.setStatus(request.getStatus());

        booking = bookingRepository.save(booking);
        return BookingResponse.fromEntity(booking);
    }

    public BookingRepository getBookingRepository() {
        return this.bookingRepository;
    }
}

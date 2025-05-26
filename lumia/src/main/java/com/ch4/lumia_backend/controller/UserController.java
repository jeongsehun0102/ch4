// src/main/java/com/ch4/lumia_backend/controller/UserController.java
package com.ch4.lumia_backend.controller;

import com.ch4.lumia_backend.dto.*;
import com.ch4.lumia_backend.entity.RefreshToken; // RefreshToken 엔티티 임포트
import com.ch4.lumia_backend.entity.User;
import com.ch4.lumia_backend.security.jwt.JwtUtil;
import com.ch4.lumia_backend.service.RefreshTokenService; // RefreshTokenService 임포트
import com.ch4.lumia_backend.service.UserService;
import com.ch4.lumia_backend.service.UserSettingService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final UserSettingService userSettingService;
    private final RefreshTokenService refreshTokenService; // <<< RefreshTokenService 주입 추가

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginRequestDto) {
        logger.info("Login attempt for user: {}", loginRequestDto.getUserId());
        boolean loginSuccess = userService.login(loginRequestDto.getUserId(), loginRequestDto.getPassword());
        if (loginSuccess) {
            String accessToken = jwtUtil.generateToken(loginRequestDto.getUserId());
            // RefreshToken 생성 및 DB 저장 (기존 것이 있다면 삭제 후 새로 생성됨 by RefreshTokenService)
            RefreshToken refreshTokenEntity = refreshTokenService.createRefreshToken(loginRequestDto.getUserId()); 
            
            logger.info("Login successful for user: {}, token generated.", loginRequestDto.getUserId());
            // LoginResponseDto에 refreshToken도 포함하여 전달
            LoginResponseDto loginResponse = new LoginResponseDto(
                    accessToken, 
                    refreshTokenEntity.getToken(), // 생성된 RefreshToken의 문자열 값을 전달
                    loginRequestDto.getUserId(), 
                    "로그인 성공!"
            );
            return ResponseEntity.ok(loginResponse);
        } else {
            logger.warn("Login failed for user: {}", loginRequestDto.getUserId());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
    }

    @PostMapping("/auth/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequestDto signupRequestDto) {
        logger.info("Signup attempt for user: {}", signupRequestDto.getUserId());
        try {
            User savedUser = userService.signup(signupRequestDto);
            logger.info("Signup successful for user: {}", savedUser.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED)
                                 .body(savedUser.getUserId() + " 님 회원가입 성공!");
        } catch (IllegalArgumentException e) {
            logger.warn("Signup failed for user {}: {}", signupRequestDto.getUserId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error during signup for user {}: {}", signupRequestDto.getUserId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("회원가입 처리 중 오류가 발생했습니다.");
        }
    }

    @GetMapping("/users/me/settings")
    public ResponseEntity<?> getUserSettings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = authentication.getName(); 

        if (currentUserId == null || "anonymousUser".equals(currentUserId)) {
            logger.warn("Attempt to get user settings without authentication.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
        }
        logger.info("Fetching settings for user: {}", currentUserId);
        try {
            UserSettingDto settingsDto = userSettingService.getUserSettings(currentUserId);
            return ResponseEntity.ok(settingsDto);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to get settings for user {}: {}", currentUserId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error fetching settings for user {}: {}", currentUserId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("설정 조회 중 오류 발생");
        }
    }

    @PutMapping("/users/me/settings")
    public ResponseEntity<?> updateUserSettings(@RequestBody UserSettingDto userSettingDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = authentication.getName();

        if (currentUserId == null || "anonymousUser".equals(currentUserId)) {
            logger.warn("Attempt to update user settings without authentication.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
        }
        logger.info("Updating settings for user: {}", currentUserId);
        try {
            UserSettingDto updatedSettings = userSettingService.updateUserSettings(currentUserId, userSettingDto);
            logger.info("Settings updated successfully for user: {}", currentUserId);
            return ResponseEntity.ok(updatedSettings);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to update settings for user {}: {}", currentUserId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating settings for user {}: {}", currentUserId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("설정 업데이트 중 오류 발생");
        }
    }

    // === 토큰 재발급 API 엔드포인트 추가 ===
    @PostMapping("/auth/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequestDto requestDto) {
        String requestRefreshToken = requestDto.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken) // DB에서 리프레시 토큰 조회
                .map(refreshTokenService::verifyExpiration) // 토큰 만료 여부 확인 (만료 시 예외 발생, 아니면 엔티티 반환)
                .map(RefreshToken::getUser) // RefreshToken 엔티티에서 User 엔티티 가져오기
                .map(user -> {
                    // 새 Access Token 생성
                    String newAccessToken = jwtUtil.generateToken(user.getUserId());
                    logger.info("New access token generated for user: {} via refresh token", user.getUserId());
                    
                    // 새 Access Token과 함께, 요청 시 사용된 Refresh Token을 그대로 다시 응답에 포함
                    // (리프레시 토큰 순환 전략을 사용하지 않는 경우)
                    return ResponseEntity.ok(new TokenRefreshResponseDto(newAccessToken, requestRefreshToken));
                })
                .orElseThrow(() -> {
                    // 리프레시 토큰을 DB에서 찾지 못했거나, 유효하지 않은 경우 (verifyExpiration에서 예외가 발생하지 않았다면)
                    logger.warn("Refresh token not found or invalid during refresh attempt: {}", requestRefreshToken);
                    // 클라이언트에게 명확한 오류를 전달하기 위해 HttpStatus.UNAUTHORIZED를 사용하는 것이 좋습니다.
                    // 현재는 RuntimeException으로 처리되지만, @ControllerAdvice 등을 통해 전역적으로 예외를 처리하여
                    // 적절한 HTTP 상태 코드를 반환하도록 개선할 수 있습니다.
                    // throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
                    return new RuntimeException("Refresh token is not in database or invalid!"); 
                });
    }
}
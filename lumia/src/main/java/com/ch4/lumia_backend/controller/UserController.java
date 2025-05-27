// src/main/java/com/ch4/lumia_backend/controller/UserController.java
package com.ch4.lumia_backend.controller;

import com.ch4.lumia_backend.dto.*;
import com.ch4.lumia_backend.entity.RefreshToken;
import com.ch4.lumia_backend.entity.User;
import com.ch4.lumia_backend.security.jwt.JwtUtil;
import com.ch4.lumia_backend.service.RefreshTokenService;
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
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginRequestDto) {
        logger.info("Login attempt for user: {}", loginRequestDto.getUserId());
        boolean loginSuccess = userService.login(loginRequestDto.getUserId(), loginRequestDto.getPassword());
        if (loginSuccess) {
            String accessToken = jwtUtil.generateToken(loginRequestDto.getUserId());
            // ▼▼▼ RefreshTokenService의 변경된 메소드 이름으로 호출 ▼▼▼
            RefreshToken refreshTokenEntity = refreshTokenService.createOrUpdateRefreshToken(loginRequestDto.getUserId()); 
            // ▲▲▲ RefreshTokenService의 변경된 메소드 이름으로 호출 ▲▲▲
            
            logger.info("Login successful for user: {}, token generated.", loginRequestDto.getUserId());
            LoginResponseDto loginResponse = new LoginResponseDto(
                    accessToken, 
                    refreshTokenEntity.getToken(),
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
        
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            logger.warn("getUserSettings: Authentication is null or user is anonymous. Responding with 401. Path: /api/users/me/settings");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("인증 정보가 유효하지 않거나 만료되었습니다. 토큰 재발급이 필요합니다.");
        }

        String currentUserId = authentication.getName(); 

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
        
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            logger.warn("updateUserSettings: Authentication is null or user is anonymous. Responding with 401. Path: /api/users/me/settings");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("인증 정보가 유효하지 않거나 만료되었습니다. 토큰 재발급이 필요합니다.");
        }
        
        String currentUserId = authentication.getName();

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

    @PostMapping("/auth/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequestDto requestDto) {
        String requestRefreshToken = requestDto.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String newAccessToken = jwtUtil.generateToken(user.getUserId());
                    logger.info("New access token generated for user: {} via refresh token", user.getUserId());
                    
                    return ResponseEntity.ok(new TokenRefreshResponseDto(newAccessToken, requestRefreshToken));
                })
                .orElseThrow(() -> {
                    logger.warn("Refresh token not found or invalid during refresh attempt: {}", requestRefreshToken);
                    return new RuntimeException("Refresh token is not in database or invalid!"); 
                });
    }

    // 명시적 로그아웃을 위한 엔드포인트 (선택 사항, 필요시 추가)
    @PostMapping("/auth/logout")
    public ResponseEntity<?> logoutUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            String currentUserId = authentication.getName();
            try {
                refreshTokenService.deleteByUserId(currentUserId); // DB에서 현재 사용자 리프레시 토큰 삭제
                logger.info("User {} explicitly logged out, refresh token deleted from DB.", currentUserId);
            } catch (Exception e) {
                logger.error("Error deleting refresh token for user {} during logout: {}", currentUserId, e.getMessage(), e);
                // 로그아웃 자체는 계속 진행되도록 오류를 던지지는 않음 (선택적)
            }
            SecurityContextHolder.clearContext(); // SecurityContext 클리어
            return ResponseEntity.ok("로그아웃 되었습니다.");
        }
        // 이미 인증 정보가 없거나 유효하지 않은 경우
        logger.warn("Logout attempt by unauthenticated or anonymous user.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그아웃할 세션 정보가 없습니다.");
    }
}
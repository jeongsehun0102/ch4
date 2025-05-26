// src/main/java/com/ch4/lumia_backend/service/RefreshTokenService.java
package com.ch4.lumia_backend.service;

import com.ch4.lumia_backend.entity.RefreshToken;
import com.ch4.lumia_backend.entity.User;
import com.ch4.lumia_backend.repository.RefreshTokenRepository;
import com.ch4.lumia_backend.repository.UserRepository;
import com.ch4.lumia_backend.security.jwt.JwtUtil; // JwtUtil 주입
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
// import java.util.UUID; // 만약 JWT 대신 UUID를 리프레시 토큰 값으로 사용한다면 필요

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository; // User 정보를 가져오기 위해 필요
    private final JwtUtil jwtUtil; // 새 Access Token 또는 Refresh Token(JWT 형태일 경우) 생성 시 필요

    // application.properties에서 Refresh Token 유효 기간을 읽어옵니다.
    @Value("${jwt.refresh.token.validity.ms}")
    private Long refreshTokenDurationMs;

    /**
     * 지정된 사용자에 대한 새 리프레시 토큰을 생성하고 저장합니다.
     * 동일한 사용자에 대한 기존 리프레시 토큰이 있다면 삭제합니다 (사용자당 하나의 리프레시 토큰 정책).
     * @param userId 리프레시 토큰을 생성할 사용자의 ID
     * @return 생성되고 저장된 RefreshToken 엔티티
     */
    @Transactional
    public RefreshToken createRefreshToken(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found with ID " + userId + " for creating refresh token."));

        // 이전에 해당 사용자에게 발급된 리프레시 토큰이 있다면 삭제합니다.
        // 이는 "하나의 기기에서만 로그인 유지" 기능을 구현하는 첫 단계가 될 수 있습니다.
        // (또는 여러 리프레시 토큰을 허용하고 관리하는 복잡한 정책을 사용할 수도 있습니다.)
        refreshTokenRepository.findByUser(user).ifPresent(refreshTokenRepository::delete);

        // JwtUtil을 사용하여 새로운 리프레시 토큰 문자열을 생성합니다.
        String tokenValue = jwtUtil.generateRefreshToken(userId);

        // 새로운 RefreshToken 엔티티를 만듭니다.
        RefreshToken refreshToken = new RefreshToken(
            user,
            tokenValue,
            Instant.now().plusMillis(refreshTokenDurationMs) // 현재 시간에 유효 기간을 더해 만료 시간 설정
        );

        // 데이터베이스에 저장합니다.
        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * 제공된 토큰 문자열로 RefreshToken 엔티티를 찾습니다.
     * @param token 찾을 리프레시 토큰 문자열
     * @return Optional<RefreshToken>
     */
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * 제공된 RefreshToken이 만료되었는지 확인하고, 만료되었다면 DB에서 삭제 후 예외를 발생시킵니다.
     * @param token 검증할 RefreshToken 엔티티
     * @return 만료되지 않았다면 동일한 RefreshToken 엔티티
     * @throws RuntimeException 리프레시 토큰이 만료된 경우
     */
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            // 토큰이 만료되었다면 DB에서 삭제합니다.
            refreshTokenRepository.delete(token);
            // 적절한 커스텀 예외를 만들어서 사용하는 것이 더 좋습니다.
            throw new RuntimeException("Error: Refresh token '" + token.getToken() + "' was expired. Please make a new signin request.");
        }
        // 만료되지 않았다면 그대로 반환합니다.
        return token;
    }

    /**
     * 특정 사용자의 모든 리프레시 토큰을 DB에서 삭제합니다. (예: 로그아웃 시 호출)
     * @param userId 토큰을 삭제할 사용자의 ID
     */
    @Transactional
    public void deleteByUserId(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found with ID " + userId + " for deleting refresh tokens."));
        refreshTokenRepository.deleteByUser(user);
    }
}
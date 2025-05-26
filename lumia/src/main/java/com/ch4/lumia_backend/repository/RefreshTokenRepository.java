// src/main/java/com/ch4/lumia_backend/repository/RefreshTokenRepository.java
package com.ch4.lumia_backend.repository;

import com.ch4.lumia_backend.entity.RefreshToken;
import com.ch4.lumia_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // @Repository는 선택적 (Spring Boot가 자동 인식)
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // 토큰 문자열 값으로 RefreshToken 엔티티를 찾습니다.
    Optional<RefreshToken> findByToken(String token);

    // 특정 사용자의 RefreshToken 엔티티를 찾습니다.
    // (한 사용자가 하나의 리프레시 토큰만 갖도록 설계했다면 이 메소드가 유용합니다.)
    Optional<RefreshToken> findByUser(User user);

    // 특정 사용자의 모든 리프레시 토큰을 삭제합니다 (예: 로그아웃 시 또는 새 토큰 발급 전 이전 토큰 정리용).
    void deleteByUser(User user);

    // (필요하다면 추가적인 조회 메소드를 정의할 수 있습니다.)
}
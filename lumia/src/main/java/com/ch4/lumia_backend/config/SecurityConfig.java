package com.ch4.lumia_backend.config; // 패키지 경로 확인

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration // 스프링 설정 클래스임을 나타냄
@EnableWebSecurity // 스프링 시큐리티 활성화
public class SecurityConfig {

    // PasswordEncoder 빈 등록 (BCrypt 방식 사용)
    // 이 Bean을 등록해두면 다른 곳(예: UserService)에서 주입받아 사용할 수 있습니다.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 기본적인 SecurityFilterChain 설정 (API 접근 권한 등)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // CSRF 보호 비활성화 (API 서버는 보통 비활성화)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 사용 안 함 (상태 유지 안 함)
            .authorizeHttpRequests(authz -> authz
                // /api/auth/** 경로의 요청은 모두 허용 (로그인, 회원가입 등)
                .requestMatchers("/api/auth/**").permitAll()
                // TODO: 나중에 다른 API 경로에 대한 접근 권한 설정 추가 필요
                .anyRequest().permitAll() // 임시로 나머지 모든 요청도 허용 (나중에 authenticated() 등으로 변경 필요)
            );
        // TODO: JWT 인증 필터 등을 나중에 여기에 추가할 수 있습니다.

        return http.build();
    }
}
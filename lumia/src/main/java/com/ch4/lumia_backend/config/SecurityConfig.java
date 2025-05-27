package com.ch4.lumia_backend.config;

import com.ch4.lumia_backend.security.jwt.JwtAuthenticationFilter;
import com.ch4.lumia_backend.security.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.AnonymousConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
// ▼▼▼ AuthenticationEntryPoint 관련 임포트 추가 ▼▼▼
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.http.HttpStatus; // HttpStatus 임포트
import org.springframework.security.web.authentication.HttpStatusEntryPoint; // HttpStatusEntryPoint 임포트
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtil jwtUtil;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .anonymous(AnonymousConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                // ▼▼▼ 이 부분을 HttpStatusEntryPoint로 수정 ▼▼▼
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)) 
                // ▲▲▲ 이 부분을 HttpStatusEntryPoint로 수정 ▲▲▲
            )
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/login", "/api/auth/signup", "/api/auth/refresh-token").permitAll()
                .requestMatchers("/api/users/me/settings").authenticated()
                .requestMatchers("/api/questions/for-me").authenticated()
                .requestMatchers("/api/answers/**").authenticated()
                .anyRequest().permitAll()
            );

        http.addFilterBefore(new JwtAuthenticationFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
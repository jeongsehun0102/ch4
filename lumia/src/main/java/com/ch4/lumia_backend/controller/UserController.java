package com.ch4.lumia_backend.controller;

import com.ch4.lumia_backend.dto.LoginRequestDto;
import com.ch4.lumia_backend.dto.LoginResponseDto; // LoginResponseDto import 추가
import com.ch4.lumia_backend.dto.SignupRequestDto;
import com.ch4.lumia_backend.entity.User;
import com.ch4.lumia_backend.security.jwt.JwtUtil; // JwtUtil import 추가 (패키지 경로 확인!)
import com.ch4.lumia_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil; // JwtUtil 의존성 주입 추가

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginRequestDto) {
        boolean loginSuccess = userService.login(loginRequestDto.getUserId(), loginRequestDto.getPassword());
        if (loginSuccess) {
            // 로그인 성공 시 토큰 생성
            String token = jwtUtil.generateToken(loginRequestDto.getUserId());

            // 토큰과 함께 응답할 DTO 생성
            LoginResponseDto loginResponse = new LoginResponseDto(token, loginRequestDto.getUserId(), "로그인 성공!");

            return ResponseEntity.ok().body(loginResponse); // LoginResponseDto 객체를 응답으로 보냄
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED) // 401 Unauthorized 상태 코드 명시
                                 .body("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
    }

    // ... (signup 메소드는 기존과 동일) ...
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequestDto signupRequestDto) {
        try {
            User savedUser = userService.signup(signupRequestDto);
            // 회원가입 성공 시 응답 형식도 일관성을 위해 객체로 변경하는 것을 고려해볼 수 있습니다.
            // 예: return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("userId", savedUser.getUserId(), "message", "회원가입 성공!"));
            return ResponseEntity.status(HttpStatus.CREATED)
                                 .body(savedUser.getUserId() + " 님 회원가입 성공!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                                 .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("회원가입 처리 중 오류가 발생했습니다.");
        }
    }
}
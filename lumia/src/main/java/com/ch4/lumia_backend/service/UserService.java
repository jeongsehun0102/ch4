package com.ch4.lumia_backend.service;
import com.ch4.lumia_backend.dto.SignupRequestDto; // DTO import 추가
import org.springframework.dao.DataIntegrityViolationException; // 제약조건 위반 예외
import com.ch4.lumia_backend.entity.User;
import com.ch4.lumia_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder; // import 추가
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // <<< PasswordEncoder 주입 추가

    @Transactional(readOnly = true)
    public boolean login(String userId, String rawPassword) { // 파라미터 이름 변경 (rawPassword)
        Optional<User> optionalUser = userRepository.findByUserId(userId);

        if (optionalUser.isPresent()) {
            User foundUser = optionalUser.get();
            // === 비밀번호 비교 로직 수정 ===
            // rawPassword: 사용자가 입력한 비밀번호 원문
            // foundUser.getPassword(): DB에 저장된 암호화된 비밀번호
            if (passwordEncoder.matches(rawPassword, foundUser.getPassword())) {
            // ============================
                System.out.println("로그인 성공: " + userId);
                return true;
            } else {
                System.out.println("로그인 실패: 비밀번호 불일치 - " + userId);
                return false;
            }
        } else {
            System.out.println("로그인 실패: 사용자 없음 - " + userId);
            return false;
        }
    }
 // === 회원가입 메소드 추가 ===
    @Transactional // 데이터베이스에 변경(CUD)이 일어나므로 @Transactional 추가
    public User signup(SignupRequestDto signupRequestDto) {
        // 1. 아이디 중복 확인 (DB 조회)
        if (userRepository.findByUserId(signupRequestDto.getUserId()).isPresent()) {
            // 이미 존재하는 아이디면 예외 발생 (Controller에서 처리)
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        // 2. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(signupRequestDto.getPassword());

        // 3. User Entity 생성 (Builder 패턴 사용)
        User newUser = User.builder()
                .userId(signupRequestDto.getUserId())
                .password(encodedPassword) // <<< 암호화된 비밀번호 저장
                .username(signupRequestDto.getUsername())
                .email(signupRequestDto.getEmail())
                .role("ROLE_USER") // <<< 기본 사용자 역할 부여 (필요시 변경)
                .build();

        // 4. UserRepository를 통해 DB에 저장
        try {
            return userRepository.save(newUser);
        } catch (DataIntegrityViolationException e) {
            // 이메일 등 다른 unique 제약조건 위반 시 예외 발생 가능
             throw new IllegalArgumentException("아이디 또는 이메일이 이미 사용 중일 수 있습니다.");
        }
    }
}
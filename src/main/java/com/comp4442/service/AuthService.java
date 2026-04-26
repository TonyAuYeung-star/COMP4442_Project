package com.comp4442.service;

import com.comp4442.config.JwtUtil;
import com.comp4442.exception.ResourceNotFoundException;
import com.comp4442.model.dto.UserDTO;
import com.comp4442.model.dto.UserResponseDTO;
import com.comp4442.model.entity.User;
import com.comp4442.model.entity.UserRole;
import com.comp4442.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication Service - handles user registration and login
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public UserResponseDTO register(UserDTO request) {
        log.info("Registering new user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : UserRole.USER)
                .build();

        User saved = userRepository.save(user);
        log.info("User registered successfully: {}", saved.getUsername());

        String token = jwtUtil.generateToken(saved.getId(), saved.getUsername(), saved.getRole().name());

        return UserResponseDTO.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .role(saved.getRole().name())
                .createdAt(saved.getCreatedAt())
                .token(token)
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponseDTO login(UserDTO request) {
        log.info("User login attempt: {}", request.getUsername());

        // Try to find user by username first, then by email
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());

        log.info("User logged in successfully: {}", user.getUsername());

        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .token(token)
                .build();
    }
}

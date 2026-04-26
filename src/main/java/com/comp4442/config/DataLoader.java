package com.comp4442.config;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.comp4442.model.entity.Room;
import com.comp4442.model.entity.User;
import com.comp4442.model.entity.UserRole;
import com.comp4442.repository.RoomRepository;
import com.comp4442.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Loads sample data on application startup if the database is empty.
 */
@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Load default users if none exist
        if (userRepository.count() == 0) {
            User testUser = new User();
            testUser.setUsername("testuser");
            testUser.setEmail("test@example.com");
            testUser.setPasswordHash(passwordEncoder.encode("password123"));
            testUser.setRole(UserRole.USER);
            testUser.setCreatedAt(LocalDateTime.now());
            testUser.setUpdatedAt(LocalDateTime.now());

            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@example.com");
            adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
            adminUser.setRole(UserRole.ADMIN);
            adminUser.setCreatedAt(LocalDateTime.now());
            adminUser.setUpdatedAt(LocalDateTime.now());

            userRepository.save(testUser);
            userRepository.save(adminUser);

            System.out.println("✅ Default users loaded: testuser/password123, admin/admin123");
        }

        // Load sample rooms if none exist
        if (roomRepository.count() == 0) {
            Room standard1 = new Room();
            standard1.setName("Cozy Standard Twin");
            standard1.setType("Standard");
            standard1.setCapacity(2);
            standard1.setPricePerNight(new BigDecimal("89.00"));
            standard1.setIsAvailable(true);
            standard1.setAmenities("Wi-Fi, TV, Air Conditioning, Mini Fridge");
            standard1.setImageUrl("https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800");
            standard1.setCreatedAt(LocalDateTime.now());
            standard1.setUpdatedAt(LocalDateTime.now());

            Room standard2 = new Room();
            standard2.setName("Standard Queen Room");
            standard2.setType("Standard");
            standard2.setCapacity(2);
            standard2.setPricePerNight(new BigDecimal("99.00"));
            standard2.setIsAvailable(true);
            standard2.setAmenities("Wi-Fi, TV, Air Conditioning, Work Desk");
            standard2.setImageUrl("https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800");
            standard2.setCreatedAt(LocalDateTime.now());
            standard2.setUpdatedAt(LocalDateTime.now());

            Room deluxe1 = new Room();
            deluxe1.setName("Deluxe Ocean View");
            deluxe1.setType("Deluxe");
            deluxe1.setCapacity(2);
            deluxe1.setPricePerNight(new BigDecimal("159.00"));
            deluxe1.setIsAvailable(true);
            deluxe1.setAmenities("Wi-Fi, TV, Air Conditioning, Balcony, Ocean View, Mini Bar");
            deluxe1.setImageUrl("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800");
            deluxe1.setCreatedAt(LocalDateTime.now());
            deluxe1.setUpdatedAt(LocalDateTime.now());

            Room deluxe2 = new Room();
            deluxe2.setName("Deluxe Family Room");
            deluxe2.setType("Deluxe");
            deluxe2.setCapacity(4);
            deluxe2.setPricePerNight(new BigDecimal("189.00"));
            deluxe2.setIsAvailable(true);
            deluxe2.setAmenities("Wi-Fi, TV, Air Conditioning, Sofa Bed, Bathtub, City View");
            deluxe2.setImageUrl("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800");
            deluxe2.setCreatedAt(LocalDateTime.now());
            deluxe2.setUpdatedAt(LocalDateTime.now());

            Room suite1 = new Room();
            suite1.setName("Executive Suite");
            suite1.setType("Suite");
            suite1.setCapacity(2);
            suite1.setPricePerNight(new BigDecimal("299.00"));
            suite1.setIsAvailable(true);
            suite1.setAmenities("Wi-Fi, TV, Air Conditioning, Living Room, Kitchenette, Jacuzzi, Sea View");
            suite1.setImageUrl("https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800");
            suite1.setCreatedAt(LocalDateTime.now());
            suite1.setUpdatedAt(LocalDateTime.now());

            Room suite2 = new Room();
            suite2.setName("Presidential Suite");
            suite2.setType("Presidential");
            suite2.setCapacity(4);
            suite2.setPricePerNight(new BigDecimal("599.00"));
            suite2.setIsAvailable(true);
            suite2.setAmenities("Wi-Fi, TV, Air Conditioning, Living Room, Dining Room, Private Pool, Butler Service, Panoramic View");
            suite2.setImageUrl("https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800");
            suite2.setCreatedAt(LocalDateTime.now());
            suite2.setUpdatedAt(LocalDateTime.now());

            roomRepository.save(standard1);
            roomRepository.save(standard2);
            roomRepository.save(deluxe1);
            roomRepository.save(deluxe2);
            roomRepository.save(suite1);
            roomRepository.save(suite2);

            System.out.println("✅ Sample room data loaded successfully! (6 rooms)");
        }
    }
}

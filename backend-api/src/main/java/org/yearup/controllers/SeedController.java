package org.yearup.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.yearup.data.ProfileDao;
import org.yearup.data.UserDao;
import org.yearup.models.Profile;
import org.yearup.models.User;

import java.util.Map;

/**
 * One-time endpoint to create the default user coralestrada28 / BiteBot4life if missing.
 * Call GET /api/seed-user (e.g. open in browser) then try logging in again.
 */
@RestController
@RequestMapping("/api")
@PreAuthorize("permitAll()")
public class SeedController {

    private static final String SEED_USERNAME = "coralestrada28";
    private static final String SEED_PASSWORD = "BiteBot4life";
    private static final String SEED_ROLE = "ROLE_CUSTOMER";

    private final UserDao userDao;
    private final ProfileDao profileDao;

    public SeedController(UserDao userDao, ProfileDao profileDao) {
        this.userDao = userDao;
        this.profileDao = profileDao;
    }

    @GetMapping("/seed-user")
    public ResponseEntity<Map<String, String>> seedUser() {
        if (userDao.exists(SEED_USERNAME)) {
            return ResponseEntity.ok(Map.of(
                "message", "User already exists. Log in with username: " + SEED_USERNAME + " and password: BiteBot4life"
            ));
        }
        try {
            User user = userDao.create(new User(0, SEED_USERNAME, SEED_PASSWORD, SEED_ROLE));
            try {
                Profile profile = new Profile();
                profile.setUserId(user.getId());
                profileDao.create(profile);
            } catch (Exception ignored) { }
            return ResponseEntity.ok(Map.of(
                "message", "Account created. Log in with username: " + SEED_USERNAME + " and password: BiteBot4life"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Could not create user: " + e.getMessage()));
        }
    }
}

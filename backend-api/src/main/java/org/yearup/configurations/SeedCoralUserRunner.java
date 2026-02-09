package org.yearup.configurations;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.yearup.data.ProfileDao;
import org.yearup.data.UserDao;
import org.yearup.models.Profile;
import org.yearup.models.User;

/**
 * Creates the default user coralestrada28 / BiteBot4life on startup if it does not exist.
 */
@Component
@Order(1)
public class SeedCoralUserRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedCoralUserRunner.class);
    private static final String SEED_USERNAME = "coralestrada28";
    private static final String SEED_PASSWORD = "BiteBot4life";
    private static final String SEED_ROLE = "ROLE_CUSTOMER";

    private final UserDao userDao;
    private final ProfileDao profileDao;

    public SeedCoralUserRunner(UserDao userDao, ProfileDao profileDao) {
        this.userDao = userDao;
        this.profileDao = profileDao;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userDao.exists(SEED_USERNAME)) {
            log.debug("User {} already exists, skipping seed.", SEED_USERNAME);
            return;
        }
        try {
            User user = userDao.create(new User(0, SEED_USERNAME, SEED_PASSWORD, SEED_ROLE));
            log.info("Created user '{}'. You can log in with username coralestrada28 and password BiteBot4life.", SEED_USERNAME);
            try {
                Profile profile = new Profile();
                profile.setUserId(user.getId());
                profileDao.create(profile);
            } catch (Exception e) {
                log.warn("Profile for '{}' could not be created: {}. You can still log in.", SEED_USERNAME, e.getMessage());
            }
        } catch (Exception e) {
            log.warn("Could not create seed user '{}': {}", SEED_USERNAME, e.getMessage());
        }
    }
}

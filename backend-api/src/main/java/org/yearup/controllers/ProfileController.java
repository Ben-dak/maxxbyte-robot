package org.yearup.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.yearup.data.ProfileDao;
import org.yearup.data.UserDao;
import org.yearup.models.Profile;
import org.yearup.models.User;

import java.security.Principal;

@RestController
@RequestMapping("/profile")
@CrossOrigin
public class ProfileController {

    private final ProfileDao profileDao;
    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(ProfileDao profileDao, UserDao userDao, PasswordEncoder passwordEncoder) {
        this.profileDao = profileDao;
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Profile getProfile(Principal principal) {
        User user = userDao.getByUserName(principal.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.");
        }
        Profile profile = profileDao.getByUserId(user.getId());
        if (profile == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found.");
        }
        if (profile.getEmail() == null || profile.getEmail().isBlank()) {
            profile.setEmail(user.getUsername());
        }
        return profile;
    }

    @PutMapping("")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Profile updateProfile(@RequestBody Profile profile, Principal principal) {
        User user = userDao.getByUserName(principal.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.");
        }
        Profile existing = profileDao.getByUserId(user.getId());
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found.");
        }

        String password = profile.getPassword();
        String confirmPassword = profile.getConfirmPassword();
        if (password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required.");
        }
        if (confirmPassword == null || !password.equals(confirmPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password and confirmation do not match.");
        }

        userDao.updatePassword(user.getId(), passwordEncoder.encode(password));

        String newEmail = profile.getEmail();
        if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(user.getUsername())) {
            User existingWithEmail = userDao.getByUserName(newEmail.trim());
            if (existingWithEmail != null && existingWithEmail.getId() != user.getId()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email address is already in use.");
            }
            userDao.updateUsername(user.getId(), newEmail.trim());
        }

        profile.setUserId(user.getId());
        if (profile.getFirstName() != null) existing.setFirstName(profile.getFirstName());
        if (profile.getLastName() != null) existing.setLastName(profile.getLastName());
        if (profile.getEmail() != null) existing.setEmail(profile.getEmail());
        if (profile.getAddress() != null) existing.setAddress(profile.getAddress());
        if (profile.getCity() != null) existing.setCity(profile.getCity());
        if (profile.getState() != null) existing.setState(profile.getState());
        if (profile.getZip() != null) existing.setZip(profile.getZip());
        if (profile.getDeliveryCountry() != null) existing.setDeliveryCountry(profile.getDeliveryCountry());
        if (profile.getBillingAddress() != null) existing.setBillingAddress(profile.getBillingAddress());
        if (profile.getBillingCity() != null) existing.setBillingCity(profile.getBillingCity());
        if (profile.getBillingState() != null) existing.setBillingState(profile.getBillingState());
        if (profile.getBillingZip() != null) existing.setBillingZip(profile.getBillingZip());
        if (profile.getBillingCountry() != null) existing.setBillingCountry(profile.getBillingCountry());
        if (profile.getNameOnCard() != null) existing.setNameOnCard(profile.getNameOnCard());
        if (profile.getCardNumberLast4() != null) existing.setCardNumberLast4(profile.getCardNumberLast4());
        if (profile.getExpMonth() != null) existing.setExpMonth(profile.getExpMonth());
        if (profile.getExpYear() != null) existing.setExpYear(profile.getExpYear());
        profileDao.update(existing);
        return existing;
    }
}

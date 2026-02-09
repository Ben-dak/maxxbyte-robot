package org.yearup.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.yearup.data.RobotDao;
import org.yearup.models.Robot;
import org.yearup.services.LoggingService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/robot")
@CrossOrigin
public class RobotController {
    private final RobotDao robotDao;
    private final LoggingService loggingService;

    public RobotController(RobotDao robotDao, LoggingService loggingService) {
        this.robotDao = robotDao;
        this.loggingService = loggingService;
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public List<Robot> getRobotStatuses() {
        return robotDao.getAll();
    }

    @GetMapping("/status/{robotId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','ROBOT')")
    public Robot getRobotStatus(@PathVariable int robotId) {
        Robot robot = robotDao.getById(robotId);
        if (robot == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Robot not found.");
        }
        return robot;
    }

    @PutMapping("/status/{robotId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','ROBOT')")
    public void updateRobotStatus(@PathVariable int robotId, @RequestBody Robot robotUpdate) {
        Robot existing = robotDao.getById(robotId);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Robot not found.");
        }

        if (robotUpdate.getCurrentSpeedMph() != null && robotUpdate.isOnPedestrianPath()) {
            if (robotUpdate.getCurrentSpeedMph().compareTo(new BigDecimal("15.0")) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pedestrian path speed must be 15 mph or less.");
            }
        }

        existing.setStatus(robotUpdate.getStatus() == null ? existing.getStatus() : robotUpdate.getStatus());
        existing.setBatteryLevel(robotUpdate.getBatteryLevel());
        existing.setCurrentLocation(robotUpdate.getCurrentLocation() == null ? existing.getCurrentLocation() : robotUpdate.getCurrentLocation());
        existing.setCurrentSpeedMph(robotUpdate.getCurrentSpeedMph() == null ? existing.getCurrentSpeedMph() : robotUpdate.getCurrentSpeedMph());
        existing.setOnPedestrianPath(robotUpdate.isOnPedestrianPath());
        existing.setStreetLegal(robotUpdate.isStreetLegal());
        existing.setLastUpdatedAt(LocalDateTime.now());

        robotDao.updateStatus(existing);
        loggingService.logRobotStatus(existing);
    }
}

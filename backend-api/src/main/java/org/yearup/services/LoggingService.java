package org.yearup.services;

import org.springframework.stereotype.Service;
import org.yearup.data.DeliveryLogDao;
import org.yearup.data.RobotLogDao;
import org.yearup.models.Delivery;
import org.yearup.models.DeliveryLog;
import org.yearup.models.Robot;
import org.yearup.models.RobotLog;

import java.time.LocalDateTime;

@Service
public class LoggingService {
    private final RobotLogDao robotLogDao;
    private final DeliveryLogDao deliveryLogDao;

    public LoggingService(RobotLogDao robotLogDao, DeliveryLogDao deliveryLogDao) {
        this.robotLogDao = robotLogDao;
        this.deliveryLogDao = deliveryLogDao;
    }

    public void logRobotStatus(Robot robot) {
        if (robot == null) {
            return;
        }

        RobotLog log = new RobotLog();
        log.setRobotId(robot.getRobotId());
        log.setStatus(robot.getStatus());
        log.setBatteryLevel(robot.getBatteryLevel());
        log.setLocation(robot.getCurrentLocation());
        log.setSpeedMph(robot.getCurrentSpeedMph());
        log.setOnPedestrianPath(robot.isOnPedestrianPath());
        log.setLoggedAt(LocalDateTime.now());
        robotLogDao.create(log);
    }

    public void logDeliveryEvent(Delivery delivery, String message) {
        if (delivery == null) {
            return;
        }

        DeliveryLog log = new DeliveryLog();
        log.setDeliveryId(delivery.getDeliveryId());
        log.setStatus(delivery.getStatus());
        log.setMessage(message);
        log.setLoggedAt(LocalDateTime.now());
        deliveryLogDao.create(log);
    }
}

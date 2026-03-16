package org.yearup.services;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.yearup.data.DeliveryDao;
import org.yearup.data.OrderDao;
import org.yearup.data.RobotDao;
import org.yearup.models.Delivery;
import org.yearup.models.Order;
import org.yearup.models.Robot;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DeliverySchedulerService {

    // TESTING MODE: 10 seconds per phase (change back to 10 for production)
    private static final long PREP_TIME_MINUTES = 0;  // Using seconds check below
    private static final long DELIVERY_TIME_MINUTES = 0;  // Using seconds check below
    private static final long TOTAL_TIME_MINUTES = PREP_TIME_MINUTES + DELIVERY_TIME_MINUTES;
    private static final long BLOCKED_AUTO_RECOVERY_MINUTES = 0;
    
    // TESTING: Use seconds instead of minutes
    private static final long PREP_TIME_SECONDS = 10;
    private static final long DELIVERY_TIME_SECONDS = 10;
    private static final long BLOCKED_AUTO_RECOVERY_SECONDS = 10;

    private final DeliveryDao deliveryDao;
    private final OrderDao orderDao;
    private final RobotDao robotDao;
    private final LoggingService loggingService;

    public DeliverySchedulerService(DeliveryDao deliveryDao, OrderDao orderDao, 
                                     RobotDao robotDao, LoggingService loggingService) {
        this.deliveryDao = deliveryDao;
        this.orderDao = orderDao;
        this.robotDao = robotDao;
        this.loggingService = loggingService;
    }

    // TESTING: Run every 5 seconds (change back to 60000 for production)
    @Scheduled(fixedRate = 5000)
    public void processDeliveryStatusTransitions() {
        processEnRouteTransitions();
        processBlockedRecovery();
        processDeliveredTransitions();
    }

    private void processEnRouteTransitions() {
        List<Delivery> pendingDeliveries = deliveryDao.getByStatus("PENDING_ASSIGNMENT");
        LocalDateTime now = LocalDateTime.now();

        for (Delivery delivery : pendingDeliveries) {
            Order order = orderDao.getById(delivery.getOrderId());
            if (order == null || order.getCreatedAt() == null) {
                continue;
            }

            // TESTING: Use seconds instead of minutes
            long secondsElapsed = ChronoUnit.SECONDS.between(order.getCreatedAt(), now);

            if (secondsElapsed >= PREP_TIME_SECONDS) {
                Robot availableRobot = findAvailableRobot();
                if (availableRobot != null) {
                    deliveryDao.assignRobot(delivery.getDeliveryId(), availableRobot.getRobotId());
                    delivery.setRobotId(availableRobot.getRobotId());
                }

                deliveryDao.updateStatus(delivery.getDeliveryId(), "EN_ROUTE");
                deliveryDao.updateStartedAt(delivery.getDeliveryId(), now);
                delivery.setStatus("EN_ROUTE");
                delivery.setStartedAt(now);

                orderDao.updateStatus(order.getOrderId(), "EN_ROUTE");

                loggingService.logDeliveryEvent(delivery, "Delivery transitioned to EN_ROUTE");
                System.out.println("Delivery #" + delivery.getDeliveryId() + " transitioned to EN_ROUTE");
            }
        }
    }

    private void processBlockedRecovery() {
        List<Delivery> blockedDeliveries = deliveryDao.getByStatus("BLOCKED");
        LocalDateTime now = LocalDateTime.now();

        for (Delivery delivery : blockedDeliveries) {
            if (delivery.getBlockedAt() == null) {
                continue;
            }

            // TESTING: Use seconds instead of minutes
            long secondsBlocked = ChronoUnit.SECONDS.between(delivery.getBlockedAt(), now);

            if (secondsBlocked >= BLOCKED_AUTO_RECOVERY_SECONDS) {
                deliveryDao.updateStatus(delivery.getDeliveryId(), "EN_ROUTE");
                deliveryDao.updateBlockedAt(delivery.getDeliveryId(), null);
                delivery.setStatus("EN_ROUTE");
                delivery.setBlockedAt(null);

                orderDao.updateStatus(delivery.getOrderId(), "EN_ROUTE");

                loggingService.logDeliveryEvent(delivery, "Obstacle auto-cleared after " + secondsBlocked + " seconds");
                System.out.println("Delivery #" + delivery.getDeliveryId() + " auto-recovered from BLOCKED to EN_ROUTE");
            }
        }
    }

    private void processDeliveredTransitions() {
        List<Delivery> enRouteDeliveries = deliveryDao.getByStatus("EN_ROUTE");
        LocalDateTime now = LocalDateTime.now();

        for (Delivery delivery : enRouteDeliveries) {
            // Check how long the delivery has been EN_ROUTE (using started_at, not order.created_at)
            if (delivery.getStartedAt() == null) {
                continue;
            }

            // TESTING: Use seconds instead of minutes
            long secondsInTransit = ChronoUnit.SECONDS.between(delivery.getStartedAt(), now);

            // Only transition to DELIVERED after being EN_ROUTE for required time
            if (secondsInTransit >= DELIVERY_TIME_SECONDS) {
                deliveryDao.updateStatus(delivery.getDeliveryId(), "DELIVERED");
                deliveryDao.updateCompletedAt(delivery.getDeliveryId(), now);
                delivery.setStatus("DELIVERED");
                delivery.setCompletedAt(now);

                orderDao.updateStatus(delivery.getOrderId(), "DELIVERED");

                loggingService.logDeliveryEvent(delivery, "Delivery completed - DELIVERED after " + secondsInTransit + " seconds in transit");
                System.out.println("Delivery #" + delivery.getDeliveryId() + " transitioned to DELIVERED (was EN_ROUTE for " + secondsInTransit + " sec)");
            }
        }
    }

    private Robot findAvailableRobot() {
        List<Robot> robots = robotDao.getAll();
        for (Robot robot : robots) {
            if ("AVAILABLE".equalsIgnoreCase(robot.getStatus()) || 
                "IDLE".equalsIgnoreCase(robot.getStatus())) {
                return robot;
            }
        }
        if (!robots.isEmpty()) {
            return robots.get(0);
        }
        return null;
    }
}

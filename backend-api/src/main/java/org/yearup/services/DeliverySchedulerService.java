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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class DeliverySchedulerService {

    // PRODUCTION: 10 minutes prep + 10 minutes delivery = 20 minutes total (per project SLA)
    private static final long PREP_TIME_MINUTES = 10;
    private static final long DELIVERY_TIME_MINUTES = 10;
    private static final long BLOCKED_AUTO_RECOVERY_MINUTES = 2;

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

    // PRODUCTION: Run every 60 seconds
    @Scheduled(fixedRate = 60000)
    public void processDeliveryStatusTransitions() {
        // Track deliveries transitioned in this cycle to prevent double-processing
        Set<Integer> justTransitioned = new HashSet<>();
        
        processInTransitTransitions(justTransitioned);
        processBlockedRecovery(justTransitioned);
        processDeliveredTransitions(justTransitioned);
    }

    private void processInTransitTransitions(Set<Integer> justTransitioned) {
        List<Delivery> preppingDeliveries = deliveryDao.getByStatus("PREPPING_ORDER");
        LocalDateTime now = LocalDateTime.now();

        for (Delivery delivery : preppingDeliveries) {
            Order order = orderDao.getById(delivery.getOrderId());
            if (order == null || order.getCreatedAt() == null) {
                continue;
            }

            long minutesElapsed = ChronoUnit.MINUTES.between(order.getCreatedAt(), now);

            if (minutesElapsed >= PREP_TIME_MINUTES) {
                Robot availableRobot = findAvailableRobot();
                if (availableRobot != null) {
                    deliveryDao.assignRobot(delivery.getDeliveryId(), availableRobot.getRobotId());
                    delivery.setRobotId(availableRobot.getRobotId());
                }

                deliveryDao.updateStatus(delivery.getDeliveryId(), "IN_TRANSIT");
                deliveryDao.updateStartedAt(delivery.getDeliveryId(), now);
                delivery.setStatus("IN_TRANSIT");
                delivery.setStartedAt(now);

                orderDao.updateStatus(order.getOrderId(), "IN_TRANSIT");

                // Mark as just transitioned to prevent immediate DELIVERED transition
                justTransitioned.add(delivery.getDeliveryId());

                loggingService.logDeliveryEvent(delivery, "Delivery transitioned to IN_TRANSIT");
                System.out.println("Delivery #" + delivery.getDeliveryId() + " transitioned to IN_TRANSIT");
            }
        }
    }

    private void processBlockedRecovery(Set<Integer> justTransitioned) {
        List<Delivery> blockedDeliveries = deliveryDao.getByStatus("BLOCKED");
        LocalDateTime now = LocalDateTime.now();

        for (Delivery delivery : blockedDeliveries) {
            if (delivery.getBlockedAt() == null) {
                continue;
            }

            long minutesBlocked = ChronoUnit.MINUTES.between(delivery.getBlockedAt(), now);

            if (minutesBlocked >= BLOCKED_AUTO_RECOVERY_MINUTES) {
                deliveryDao.updateStatus(delivery.getDeliveryId(), "IN_TRANSIT");
                deliveryDao.updateBlockedAt(delivery.getDeliveryId(), null);
                delivery.setStatus("IN_TRANSIT");
                delivery.setBlockedAt(null);

                orderDao.updateStatus(delivery.getOrderId(), "IN_TRANSIT");

                // Mark as just transitioned
                justTransitioned.add(delivery.getDeliveryId());

                loggingService.logDeliveryEvent(delivery, "Obstacle auto-cleared after " + minutesBlocked + " minutes");
                System.out.println("Delivery #" + delivery.getDeliveryId() + " auto-recovered from BLOCKED to IN_TRANSIT");
            }
        }
    }

    private void processDeliveredTransitions(Set<Integer> justTransitioned) {
        List<Delivery> inTransitDeliveries = deliveryDao.getByStatus("IN_TRANSIT");
        LocalDateTime now = LocalDateTime.now();

        for (Delivery delivery : inTransitDeliveries) {
            // Skip if this delivery was just transitioned to IN_TRANSIT in this cycle
            if (justTransitioned.contains(delivery.getDeliveryId())) {
                continue;
            }

            // Check how long the delivery has been IN_TRANSIT (using started_at)
            if (delivery.getStartedAt() == null) {
                continue;
            }

            long minutesInTransit = ChronoUnit.MINUTES.between(delivery.getStartedAt(), now);

            // Only transition to DELIVERED after being IN_TRANSIT for required time
            if (minutesInTransit >= DELIVERY_TIME_MINUTES) {
                deliveryDao.updateStatus(delivery.getDeliveryId(), "DELIVERED");
                deliveryDao.updateCompletedAt(delivery.getDeliveryId(), now);
                delivery.setStatus("DELIVERED");
                delivery.setCompletedAt(now);

                orderDao.updateStatus(delivery.getOrderId(), "DELIVERED");

                loggingService.logDeliveryEvent(delivery, "Delivery completed - DELIVERED after " + minutesInTransit + " minutes in transit");
                System.out.println("Delivery #" + delivery.getDeliveryId() + " transitioned to DELIVERED");
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

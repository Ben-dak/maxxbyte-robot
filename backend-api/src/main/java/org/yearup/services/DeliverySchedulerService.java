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

    private static final long PREP_TIME_MINUTES = 10;
    private static final long DELIVERY_TIME_MINUTES = 10;
    private static final long TOTAL_TIME_MINUTES = PREP_TIME_MINUTES + DELIVERY_TIME_MINUTES;

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

    @Scheduled(fixedRate = 60000)
    public void processDeliveryStatusTransitions() {
        processEnRouteTransitions();
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

            long minutesElapsed = ChronoUnit.MINUTES.between(order.getCreatedAt(), now);

            if (minutesElapsed >= PREP_TIME_MINUTES) {
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

    private void processDeliveredTransitions() {
        List<Delivery> enRouteDeliveries = deliveryDao.getByStatus("EN_ROUTE");
        LocalDateTime now = LocalDateTime.now();

        for (Delivery delivery : enRouteDeliveries) {
            Order order = orderDao.getById(delivery.getOrderId());
            if (order == null || order.getCreatedAt() == null) {
                continue;
            }

            long minutesElapsed = ChronoUnit.MINUTES.between(order.getCreatedAt(), now);

            if (minutesElapsed >= TOTAL_TIME_MINUTES) {
                deliveryDao.updateStatus(delivery.getDeliveryId(), "DELIVERED");
                deliveryDao.updateCompletedAt(delivery.getDeliveryId(), now);
                delivery.setStatus("DELIVERED");
                delivery.setCompletedAt(now);

                orderDao.updateStatus(order.getOrderId(), "DELIVERED");

                loggingService.logDeliveryEvent(delivery, "Delivery completed - DELIVERED");
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

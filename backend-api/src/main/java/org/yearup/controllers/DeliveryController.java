package org.yearup.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.yearup.data.DeliveryDao;
import org.yearup.data.OrderDao;
import org.yearup.models.Delivery;
import org.yearup.services.LoggingService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/deliveries")
@CrossOrigin
public class DeliveryController {

    private final DeliveryDao deliveryDao;
    private final OrderDao orderDao;
    private final LoggingService loggingService;

    public DeliveryController(DeliveryDao deliveryDao, OrderDao orderDao, LoggingService loggingService) {
        this.deliveryDao = deliveryDao;
        this.orderDao = orderDao;
        this.loggingService = loggingService;
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Delivery getDeliveryByOrderId(@PathVariable int orderId) {
        Delivery delivery = deliveryDao.getByOrderId(orderId);
        if (delivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found for order.");
        }
        return delivery;
    }

    /** TC-007: Obstacle detection - block delivery. Exception handling ensures failures are reported cleanly. */
    @PostMapping("/{deliveryId}/block")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','ROBOT')")
    @Transactional
    public Map<String, Object> simulateObstacle(@PathVariable int deliveryId) {
        Delivery delivery = deliveryDao.getById(deliveryId);
        if (delivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found.");
        }

        if (!"IN_TRANSIT".equals(delivery.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Can only block deliveries that are IN_TRANSIT. Current status: " + delivery.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        try {
            deliveryDao.updateStatus(deliveryId, "BLOCKED");
            deliveryDao.updateBlockedAt(deliveryId, now);
            orderDao.updateStatus(delivery.getOrderId(), "BLOCKED");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed to block delivery: " + e.getMessage());
        }

        try {
            loggingService.logDeliveryEvent(delivery, "Obstacle detected - delivery BLOCKED");
        } catch (Exception e) {
            System.err.println("Logging failed for obstacle block: " + e.getMessage());
        }
        System.out.println("Delivery #" + deliveryId + " BLOCKED due to obstacle at " + now);

        Map<String, Object> response = new HashMap<>();
        response.put("deliveryId", deliveryId);
        response.put("status", "BLOCKED");
        response.put("blockedAt", now.toString());
        response.put("message", "Obstacle detected. Delivery paused.");
        return response;
    }

    /** TC-007: Obstacle cleared - unblock delivery. Exception handling ensures failures are reported cleanly. */
    @PostMapping("/{deliveryId}/unblock")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','ROBOT')")
    @Transactional
    public Map<String, Object> resolveObstacle(@PathVariable int deliveryId) {
        Delivery delivery = deliveryDao.getById(deliveryId);
        if (delivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found.");
        }

        if (!"BLOCKED".equals(delivery.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Delivery is not blocked. Current status: " + delivery.getStatus());
        }

        try {
            deliveryDao.updateStatus(deliveryId, "IN_TRANSIT");
            deliveryDao.updateBlockedAt(deliveryId, null);
            orderDao.updateStatus(delivery.getOrderId(), "IN_TRANSIT");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed to unblock delivery: " + e.getMessage());
        }

        try {
            loggingService.logDeliveryEvent(delivery, "Obstacle cleared - delivery resumed IN_TRANSIT");
        } catch (Exception e) {
            System.err.println("Logging failed for obstacle unblock: " + e.getMessage());
        }
        System.out.println("Delivery #" + deliveryId + " unblocked, resuming IN_TRANSIT");

        Map<String, Object> response = new HashMap<>();
        response.put("deliveryId", deliveryId);
        response.put("status", "IN_TRANSIT");
        response.put("message", "Obstacle cleared. Delivery resumed.");
        return response;
    }

    @PostMapping("/order/{orderId}/block")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Map<String, Object> simulateObstacleByOrderId(@PathVariable int orderId) {
        Delivery delivery = deliveryDao.getByOrderId(orderId);
        if (delivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found for order.");
        }
        return simulateObstacle(delivery.getDeliveryId());
    }

    @PostMapping("/order/{orderId}/unblock")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Map<String, Object> resolveObstacleByOrderId(@PathVariable int orderId) {
        Delivery delivery = deliveryDao.getByOrderId(orderId);
        if (delivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found for order.");
        }
        return resolveObstacle(delivery.getDeliveryId());
    }

    /**
     * TC-012: Manual Stop / E-Stop endpoint
     * Allows user to abort/cancel an active delivery
     */
    @PostMapping("/{deliveryId}/abort")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Map<String, Object> abortDelivery(@PathVariable int deliveryId) {
        Delivery delivery = deliveryDao.getById(deliveryId);
        if (delivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found.");
        }

        String currentStatus = delivery.getStatus();
        if ("DELIVERED".equals(currentStatus) || "CANCELLED".equals(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Cannot abort delivery. Current status: " + currentStatus);
        }

        LocalDateTime now = LocalDateTime.now();
        deliveryDao.updateStatus(deliveryId, "CANCELLED");
        deliveryDao.updateCompletedAt(deliveryId, now);
        orderDao.updateStatus(delivery.getOrderId(), "CANCELLED");

        loggingService.logDeliveryEvent(delivery, "EMERGENCY STOP - Delivery manually aborted by user");
        System.out.println("*** E-STOP *** Delivery #" + deliveryId + " CANCELLED at " + now);

        Map<String, Object> response = new HashMap<>();
        response.put("deliveryId", deliveryId);
        response.put("status", "CANCELLED");
        response.put("cancelledAt", now.toString());
        response.put("message", "Delivery has been stopped. Robot returning to base.");
        return response;
    }

    @PostMapping("/order/{orderId}/abort")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Map<String, Object> abortDeliveryByOrderId(@PathVariable int orderId) {
        Delivery delivery = deliveryDao.getByOrderId(orderId);
        if (delivery == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found for order.");
        }
        return abortDelivery(delivery.getDeliveryId());
    }
}

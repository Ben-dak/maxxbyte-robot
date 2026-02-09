package org.yearup.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.yearup.data.DeliveryDao;
import org.yearup.data.OrderDao;
import org.yearup.data.UserDao;
import org.yearup.models.Delivery;
import org.yearup.models.Order;
import org.yearup.models.OrderStatusUpdateDto;
import org.yearup.models.User;
import org.yearup.services.LoggingService;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/orders")
@CrossOrigin
public class OrdersController {
    private final OrderDao orderDao;
    private final DeliveryDao deliveryDao;
    private final UserDao userDao;
    private final LoggingService loggingService;

    public OrdersController(OrderDao orderDao, DeliveryDao deliveryDao, UserDao userDao, LoggingService loggingService) {
        this.orderDao = orderDao;
        this.deliveryDao = deliveryDao;
        this.userDao = userDao;
        this.loggingService = loggingService;
    }

    @GetMapping("")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public List<Order> getOrders(Principal principal) {
        if (isStaffOrAdmin()) {
            return orderDao.getAll();
        }

        User user = userDao.getByUserName(principal.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.");
        }

        return orderDao.getByUserId(user.getId());
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Order getOrderById(@PathVariable int orderId, Principal principal) {
        Order order = orderDao.getById(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found.");
        }

        if (isStaffOrAdmin()) {
            return order;
        }

        User user = userDao.getByUserName(principal.getName());
        if (user == null || order.getUserId() != user.getId()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own orders.");
        }

        return order;
    }

    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','USER','CUSTOMER')")
    public Order createOrder(@RequestBody Order order, Principal principal) {
        if (!isStaffOrAdmin()) {
            User user = userDao.getByUserName(principal.getName());
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.");
            }
            order.setUserId(user.getId());
        }

        if (isBlank(order.getDeliveryAddress()) || isBlank(order.getDeliveryCity())
                || isBlank(order.getDeliveryState()) || isBlank(order.getDeliveryZip())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery address is required.");
        }

        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("PLACED");
        }
        if (order.getCreatedAt() == null) {
            order.setCreatedAt(LocalDateTime.now());
        }

        Order created = orderDao.create(order);
        if (created == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Order could not be created.");
        }

        Delivery delivery = new Delivery();
        delivery.setOrderId(created.getOrderId());
        delivery.setStatus("PENDING_ASSIGNMENT");
        delivery.setPickupLocation("Main Kitchen");
        delivery.setDropoffLocation(created.getDeliveryAddress());
        Delivery createdDelivery = deliveryDao.create(delivery);
        loggingService.logDeliveryEvent(createdDelivery, "Delivery record created.");

        return created;
    }

    @PutMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','ROBOT')")
    public void updateOrderStatus(@PathVariable int orderId, @RequestBody OrderStatusUpdateDto updateDto) {
        if (updateDto == null || updateDto.getStatus() == null || updateDto.getStatus().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required.");
        }

        Order order = orderDao.getById(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found.");
        }

        orderDao.updateStatus(orderId, updateDto.getStatus());

        Delivery delivery = deliveryDao.getByOrderId(orderId);
        if (delivery != null) {
            deliveryDao.updateStatus(delivery.getDeliveryId(), updateDto.getStatus());
            delivery.setStatus(updateDto.getStatus());
            loggingService.logDeliveryEvent(delivery, "Order status updated.");
        }
    }

    private boolean isStaffOrAdmin() {
        return hasRole("ROLE_ADMIN") || hasRole("ROLE_STAFF");
    }

    private boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> role.equalsIgnoreCase(authority.getAuthority()));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

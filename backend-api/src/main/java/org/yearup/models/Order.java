package org.yearup.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Order {
    private int orderId;
    private int userId;
    private String status;
    private LocalDateTime createdAt;
    private String deliveryAddress;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryZip;
    private BigDecimal totalAmount;

    public Order() {
    }

    public Order(int orderId, int userId, String status, LocalDateTime createdAt, String deliveryAddress,
                 String deliveryCity, String deliveryState, String deliveryZip, BigDecimal totalAmount) {
        this.orderId = orderId;
        this.userId = userId;
        this.status = status;
        this.createdAt = createdAt;
        this.deliveryAddress = deliveryAddress;
        this.deliveryCity = deliveryCity;
        this.deliveryState = deliveryState;
        this.deliveryZip = deliveryZip;
        this.totalAmount = totalAmount;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getDeliveryCity() {
        return deliveryCity;
    }

    public void setDeliveryCity(String deliveryCity) {
        this.deliveryCity = deliveryCity;
    }

    public String getDeliveryState() {
        return deliveryState;
    }

    public void setDeliveryState(String deliveryState) {
        this.deliveryState = deliveryState;
    }

    public String getDeliveryZip() {
        return deliveryZip;
    }

    public void setDeliveryZip(String deliveryZip) {
        this.deliveryZip = deliveryZip;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}

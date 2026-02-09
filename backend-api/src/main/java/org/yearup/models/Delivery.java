package org.yearup.models;

import java.time.LocalDateTime;

public class Delivery {
    private int deliveryId;
    private int orderId;
    private Integer robotId;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String pickupLocation;
    private String dropoffLocation;

    public Delivery() {
    }

    public Delivery(int deliveryId, int orderId, Integer robotId, String status, LocalDateTime startedAt,
                    LocalDateTime completedAt, String pickupLocation, String dropoffLocation) {
        this.deliveryId = deliveryId;
        this.orderId = orderId;
        this.robotId = robotId;
        this.status = status;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.pickupLocation = pickupLocation;
        this.dropoffLocation = dropoffLocation;
    }

    public int getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(int deliveryId) {
        this.deliveryId = deliveryId;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public Integer getRobotId() {
        return robotId;
    }

    public void setRobotId(Integer robotId) {
        this.robotId = robotId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getDropoffLocation() {
        return dropoffLocation;
    }

    public void setDropoffLocation(String dropoffLocation) {
        this.dropoffLocation = dropoffLocation;
    }
}

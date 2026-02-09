package org.yearup.models;

import java.time.LocalDateTime;

public class DeliveryLog {
    private int logId;
    private int deliveryId;
    private String status;
    private String message;
    private LocalDateTime loggedAt;

    public DeliveryLog() {
    }

    public DeliveryLog(int logId, int deliveryId, String status, String message, LocalDateTime loggedAt) {
        this.logId = logId;
        this.deliveryId = deliveryId;
        this.status = status;
        this.message = message;
        this.loggedAt = loggedAt;
    }

    public int getLogId() {
        return logId;
    }

    public void setLogId(int logId) {
        this.logId = logId;
    }

    public int getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(int deliveryId) {
        this.deliveryId = deliveryId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(LocalDateTime loggedAt) {
        this.loggedAt = loggedAt;
    }
}

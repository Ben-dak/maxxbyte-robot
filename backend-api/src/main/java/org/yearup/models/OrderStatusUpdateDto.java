package org.yearup.models;

public class OrderStatusUpdateDto {
    private String status;

    public OrderStatusUpdateDto() {
    }

    public OrderStatusUpdateDto(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

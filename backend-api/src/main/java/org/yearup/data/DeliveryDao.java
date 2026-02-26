package org.yearup.data;

import org.yearup.models.Delivery;

import java.time.LocalDateTime;
import java.util.List;

public interface DeliveryDao {
    Delivery getById(int deliveryId);
    Delivery getByOrderId(int orderId);
    Delivery create(Delivery delivery);
    void updateStatus(int deliveryId, String status);
    void assignRobot(int deliveryId, int robotId);
    List<Delivery> getByStatus(String status);
    void updateStartedAt(int deliveryId, LocalDateTime startedAt);
    void updateCompletedAt(int deliveryId, LocalDateTime completedAt);
}

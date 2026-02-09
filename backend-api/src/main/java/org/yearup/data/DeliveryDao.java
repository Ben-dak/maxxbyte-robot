package org.yearup.data;

import org.yearup.models.Delivery;

public interface DeliveryDao {
    Delivery getById(int deliveryId);
    Delivery getByOrderId(int orderId);
    Delivery create(Delivery delivery);
    void updateStatus(int deliveryId, String status);
    void assignRobot(int deliveryId, int robotId);
}

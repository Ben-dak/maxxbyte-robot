package org.yearup.data;

import org.yearup.models.Order;

import java.util.List;

public interface OrderDao {
    List<Order> getAll();
    List<Order> getByUserId(int userId);
    Order getById(int orderId);
    Order create(Order order);
    void updateStatus(int orderId, String status);
}

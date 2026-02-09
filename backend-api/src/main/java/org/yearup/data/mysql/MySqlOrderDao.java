package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.data.OrderDao;
import org.yearup.models.Order;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class MySqlOrderDao extends MySqlDaoBase implements OrderDao {
    public MySqlOrderDao(DataSource dataSource) {
        super(dataSource);
    }

    @Override
    public List<Order> getAll() {
        List<Order> orders = new ArrayList<>();
        String sql = "SELECT * FROM orders ORDER BY created_at DESC";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet row = statement.executeQuery()) {
            while (row.next()) {
                orders.add(mapRow(row));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        return orders;
    }

    @Override
    public List<Order> getByUserId(int userId) {
        List<Order> orders = new ArrayList<>();
        String sql = "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, userId);
            try (ResultSet row = statement.executeQuery()) {
                while (row.next()) {
                    orders.add(mapRow(row));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        return orders;
    }

    @Override
    public Order getById(int orderId) {
        String sql = "SELECT * FROM orders WHERE order_id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, orderId);
            try (ResultSet row = statement.executeQuery()) {
                if (row.next()) {
                    return mapRow(row);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        return null;
    }

    @Override
    public Order create(Order order) {
        String sql = "INSERT INTO orders (user_id, status, created_at, delivery_address, delivery_city, delivery_state, delivery_zip, total_amount) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        LocalDateTime createdAt = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setInt(1, order.getUserId());
            statement.setString(2, order.getStatus());
            statement.setTimestamp(3, Timestamp.valueOf(createdAt));
            statement.setString(4, order.getDeliveryAddress());
            statement.setString(5, order.getDeliveryCity());
            statement.setString(6, order.getDeliveryState());
            statement.setString(7, order.getDeliveryZip());
            statement.setBigDecimal(8, order.getTotalAmount());

            int rowsAffected = statement.executeUpdate();
            if (rowsAffected > 0) {
                try (ResultSet keys = statement.getGeneratedKeys()) {
                    if (keys.next()) {
                        int orderId = keys.getInt(1);
                        return getById(orderId);
                    }
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        return null;
    }

    @Override
    public void updateStatus(int orderId, String status) {
        String sql = "UPDATE orders SET status = ? WHERE order_id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setInt(2, orderId);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private static Order mapRow(ResultSet row) throws SQLException {
        int orderId = row.getInt("order_id");
        int userId = row.getInt("user_id");
        String status = row.getString("status");
        Timestamp createdAt = row.getTimestamp("created_at");
        String deliveryAddress = row.getString("delivery_address");
        String deliveryCity = row.getString("delivery_city");
        String deliveryState = row.getString("delivery_state");
        String deliveryZip = row.getString("delivery_zip");

        return new Order(
                orderId,
                userId,
                status,
                createdAt == null ? null : createdAt.toLocalDateTime(),
                deliveryAddress,
                deliveryCity,
                deliveryState,
                deliveryZip,
                row.getBigDecimal("total_amount")
        );
    }
}

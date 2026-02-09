package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.data.DeliveryDao;
import org.yearup.models.Delivery;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDateTime;

@Component
public class MySqlDeliveryDao extends MySqlDaoBase implements DeliveryDao {
    public MySqlDeliveryDao(DataSource dataSource) {
        super(dataSource);
    }

    @Override
    public Delivery getById(int deliveryId) {
        String sql = "SELECT * FROM deliveries WHERE delivery_id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, deliveryId);
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
    public Delivery getByOrderId(int orderId) {
        String sql = "SELECT * FROM deliveries WHERE order_id = ?";

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
    public Delivery create(Delivery delivery) {
        String sql = "INSERT INTO deliveries (order_id, robot_id, status, started_at, completed_at, pickup_location, dropoff_location) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setInt(1, delivery.getOrderId());
            if (delivery.getRobotId() == null) {
                statement.setNull(2, Types.INTEGER);
            } else {
                statement.setInt(2, delivery.getRobotId());
            }
            statement.setString(3, delivery.getStatus());
            statement.setTimestamp(4, toTimestamp(delivery.getStartedAt()));
            statement.setTimestamp(5, toTimestamp(delivery.getCompletedAt()));
            statement.setString(6, delivery.getPickupLocation());
            statement.setString(7, delivery.getDropoffLocation());

            int rowsAffected = statement.executeUpdate();
            if (rowsAffected > 0) {
                try (ResultSet keys = statement.getGeneratedKeys()) {
                    if (keys.next()) {
                        return getById(keys.getInt(1));
                    }
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        return null;
    }

    @Override
    public void updateStatus(int deliveryId, String status) {
        String sql = "UPDATE deliveries SET status = ? WHERE delivery_id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setInt(2, deliveryId);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void assignRobot(int deliveryId, int robotId) {
        String sql = "UPDATE deliveries SET robot_id = ? WHERE delivery_id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, robotId);
            statement.setInt(2, deliveryId);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private static Delivery mapRow(ResultSet row) throws SQLException {
        int deliveryId = row.getInt("delivery_id");
        int orderId = row.getInt("order_id");
        Integer robotId = row.getObject("robot_id", Integer.class);
        String status = row.getString("status");
        Timestamp startedAt = row.getTimestamp("started_at");
        Timestamp completedAt = row.getTimestamp("completed_at");
        String pickupLocation = row.getString("pickup_location");
        String dropoffLocation = row.getString("dropoff_location");

        return new Delivery(
                deliveryId,
                orderId,
                robotId,
                status,
                startedAt == null ? null : startedAt.toLocalDateTime(),
                completedAt == null ? null : completedAt.toLocalDateTime(),
                pickupLocation,
                dropoffLocation
        );
    }

    private Timestamp toTimestamp(LocalDateTime value) {
        return value == null ? null : Timestamp.valueOf(value);
    }
}

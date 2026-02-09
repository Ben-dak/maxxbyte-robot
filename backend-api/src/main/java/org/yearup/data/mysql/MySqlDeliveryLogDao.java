package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.data.DeliveryLogDao;
import org.yearup.models.DeliveryLog;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;

@Component
public class MySqlDeliveryLogDao extends MySqlDaoBase implements DeliveryLogDao {
    public MySqlDeliveryLogDao(DataSource dataSource) {
        super(dataSource);
    }

    @Override
    public void create(DeliveryLog deliveryLog) {
        String sql = "INSERT INTO delivery_logs (delivery_id, status, message, logged_at) VALUES (?, ?, ?, ?)";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, deliveryLog.getDeliveryId());
            statement.setString(2, deliveryLog.getStatus());
            statement.setString(3, deliveryLog.getMessage());
            statement.setTimestamp(4, deliveryLog.getLoggedAt() == null ? null : Timestamp.valueOf(deliveryLog.getLoggedAt()));
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}

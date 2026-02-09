package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.data.RobotLogDao;
import org.yearup.models.RobotLog;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;

@Component
public class MySqlRobotLogDao extends MySqlDaoBase implements RobotLogDao {
    public MySqlRobotLogDao(DataSource dataSource) {
        super(dataSource);
    }

    @Override
    public void create(RobotLog robotLog) {
        String sql = "INSERT INTO robot_logs (robot_id, status, battery_level, location, speed_mph, on_pedestrian_path, logged_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, robotLog.getRobotId());
            statement.setString(2, robotLog.getStatus());
            statement.setInt(3, robotLog.getBatteryLevel());
            statement.setString(4, robotLog.getLocation());
            statement.setBigDecimal(5, robotLog.getSpeedMph());
            statement.setBoolean(6, robotLog.isOnPedestrianPath());
            statement.setTimestamp(7, robotLog.getLoggedAt() == null ? null : Timestamp.valueOf(robotLog.getLoggedAt()));
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}

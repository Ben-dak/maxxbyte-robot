package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.data.RobotDao;
import org.yearup.models.Robot;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class MySqlRobotDao extends MySqlDaoBase implements RobotDao {
    public MySqlRobotDao(DataSource dataSource) {
        super(dataSource);
    }

    @Override
    public List<Robot> getAll() {
        List<Robot> robots = new ArrayList<>();
        String sql = "SELECT * FROM robots ORDER BY robot_id";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet row = statement.executeQuery()) {
            while (row.next()) {
                robots.add(mapRow(row));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        return robots;
    }

    @Override
    public Robot getById(int robotId) {
        String sql = "SELECT * FROM robots WHERE robot_id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, robotId);
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
    public Robot create(Robot robot) {
        String sql = "INSERT INTO robots (name, status, battery_level, current_location, current_speed_mph, on_pedestrian_path, street_legal, last_updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, robot.getName());
            statement.setString(2, robot.getStatus());
            statement.setInt(3, robot.getBatteryLevel());
            statement.setString(4, robot.getCurrentLocation());
            statement.setBigDecimal(5, robot.getCurrentSpeedMph() == null ? BigDecimal.ZERO : robot.getCurrentSpeedMph());
            statement.setBoolean(6, robot.isOnPedestrianPath());
            statement.setBoolean(7, robot.isStreetLegal());
            statement.setTimestamp(8, toTimestamp(robot.getLastUpdatedAt()));

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
    public void updateStatus(Robot robot) {
        String sql = "UPDATE robots SET status = ?, battery_level = ?, current_location = ?, current_speed_mph = ?, " +
                "on_pedestrian_path = ?, street_legal = ?, last_updated_at = ? WHERE robot_id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, robot.getStatus());
            statement.setInt(2, robot.getBatteryLevel());
            statement.setString(3, robot.getCurrentLocation());
            statement.setBigDecimal(4, robot.getCurrentSpeedMph() == null ? BigDecimal.ZERO : robot.getCurrentSpeedMph());
            statement.setBoolean(5, robot.isOnPedestrianPath());
            statement.setBoolean(6, robot.isStreetLegal());
            statement.setTimestamp(7, toTimestamp(robot.getLastUpdatedAt()));
            statement.setInt(8, robot.getRobotId());
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private static Robot mapRow(ResultSet row) throws SQLException {
        int robotId = row.getInt("robot_id");
        String name = row.getString("name");
        String status = row.getString("status");
        int batteryLevel = row.getInt("battery_level");
        String currentLocation = row.getString("current_location");
        BigDecimal currentSpeedMph = row.getBigDecimal("current_speed_mph");
        boolean onPedestrianPath = row.getBoolean("on_pedestrian_path");
        boolean streetLegal = row.getBoolean("street_legal");
        Timestamp lastUpdatedAt = row.getTimestamp("last_updated_at");

        return new Robot(
                robotId,
                name,
                status,
                batteryLevel,
                currentLocation,
                currentSpeedMph,
                onPedestrianPath,
                streetLegal,
                lastUpdatedAt == null ? null : lastUpdatedAt.toLocalDateTime()
        );
    }

    private Timestamp toTimestamp(LocalDateTime value) {
        return value == null ? null : Timestamp.valueOf(value);
    }
}

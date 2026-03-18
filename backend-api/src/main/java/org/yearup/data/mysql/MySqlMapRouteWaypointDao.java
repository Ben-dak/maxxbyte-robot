package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.data.MapRouteWaypointDao;
import org.yearup.models.MapRouteWaypoint;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Component
public class MySqlMapRouteWaypointDao extends MySqlDaoBase implements MapRouteWaypointDao {

    public MySqlMapRouteWaypointDao(DataSource dataSource) {
        super(dataSource);
    }

    @Override
    public List<MapRouteWaypoint> getWaypointsForRoute(int restaurantId, String deliveryLocationKey) {
        List<MapRouteWaypoint> waypoints = new ArrayList<>();
        String sql = "SELECT * FROM map_route_waypoints WHERE restaurant_id = ? AND delivery_location_key = ? ORDER BY waypoint_order";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, restaurantId);
            statement.setString(2, deliveryLocationKey);
            try (ResultSet row = statement.executeQuery()) {
                while (row.next()) {
                    waypoints.add(mapRow(row));
                }
            }
        } catch (SQLException e) {
            return waypoints;
        }

        return waypoints;
    }

    private static MapRouteWaypoint mapRow(ResultSet row) throws SQLException {
        MapRouteWaypoint wp = new MapRouteWaypoint();
        wp.setWaypointId(row.getInt("waypoint_id"));
        wp.setRestaurantId(row.getInt("restaurant_id"));
        wp.setDeliveryLocationKey(row.getString("delivery_location_key"));
        wp.setWaypointOrder(row.getInt("waypoint_order"));
        wp.setMapYPercent(row.getBigDecimal("map_y_percent"));
        wp.setMapXPercent(row.getBigDecimal("map_x_percent"));
        return wp;
    }
}

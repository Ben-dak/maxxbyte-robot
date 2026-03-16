package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.data.DeliveryLocationDao;
import org.yearup.models.DeliveryLocation;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Component
public class MySqlDeliveryLocationDao extends MySqlDaoBase implements DeliveryLocationDao {
    
    public MySqlDeliveryLocationDao(DataSource dataSource) {
        super(dataSource);
    }

    @Override
    public List<DeliveryLocation> getAllActive() {
        List<DeliveryLocation> locations = new ArrayList<>();
        String sql = "SELECT * FROM delivery_locations WHERE is_active = TRUE ORDER BY location_name";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet row = statement.executeQuery()) {
            while (row.next()) {
                locations.add(mapRow(row));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        return locations;
    }

    @Override
    public DeliveryLocation getByKey(String locationKey) {
        String sql = "SELECT * FROM delivery_locations WHERE location_key = ? AND is_active = TRUE";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, locationKey);
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
    public DeliveryLocation getById(int locationId) {
        String sql = "SELECT * FROM delivery_locations WHERE location_id = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, locationId);
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

    private static DeliveryLocation mapRow(ResultSet row) throws SQLException {
        DeliveryLocation location = new DeliveryLocation();
        location.setLocationId(row.getInt("location_id"));
        location.setLocationKey(row.getString("location_key"));
        location.setLocationName(row.getString("location_name"));
        location.setAddress(row.getString("address"));
        location.setCity(row.getString("city"));
        location.setState(row.getString("state"));
        location.setZip(row.getString("zip"));
        location.setCountry(row.getString("country"));
        location.setCardNumber(row.getString("card_number"));
        location.setCardExp(row.getString("card_exp"));
        location.setCardCvv(row.getString("card_cvv"));
        location.setBillingAddress(row.getString("billing_address"));
        location.setBillingCity(row.getString("billing_city"));
        location.setBillingState(row.getString("billing_state"));
        location.setBillingZip(row.getString("billing_zip"));
        location.setBillingCountry(row.getString("billing_country"));
        location.setActive(row.getBoolean("is_active"));
        return location;
    }
}

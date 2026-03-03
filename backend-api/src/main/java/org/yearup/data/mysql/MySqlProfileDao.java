package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.models.Profile;
import org.yearup.data.ProfileDao;

import javax.sql.DataSource;
import java.sql.*;

@Component
public class MySqlProfileDao extends MySqlDaoBase implements ProfileDao
{
    public MySqlProfileDao(DataSource dataSource)
    {
        super(dataSource);
    }

    @Override
    public Profile create(Profile profile)
    {
        String sql = "INSERT INTO profiles (user_id, first_name, last_name, phone, email, address, city, state, zip) " +
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try(Connection connection = getConnection())
        {
            PreparedStatement ps = connection.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS);
            ps.setInt(1, profile.getUserId());
            ps.setString(2, profile.getFirstName());
            ps.setString(3, profile.getLastName());
            ps.setString(4, profile.getPhone());
            ps.setString(5, profile.getEmail());
            ps.setString(6, profile.getAddress());
            ps.setString(7, profile.getCity());
            ps.setString(8, profile.getState());
            ps.setString(9, profile.getZip());

            ps.executeUpdate();

            return profile;
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
    }

    @Override
    public Profile getByUserId(int userId) {
        String sqlFull = "SELECT user_id, first_name, last_name, phone, email, address, city, state, zip, " +
                " name_on_card, card_number_last4, exp_month, exp_year, billing_address, billing_city, billing_state, billing_zip, billing_country, " +
                " delivery_country FROM profiles WHERE user_id = ?";
        String sqlBase = "SELECT user_id, first_name, last_name, phone, email, address, city, state, zip FROM profiles WHERE user_id = ?";
        try (Connection conn = getConnection()) {
            try {
                PreparedStatement ps = conn.prepareStatement(sqlFull);
                ps.setInt(1, userId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    return mapRow(rs);
                }
            } catch (SQLException e) {
                PreparedStatement ps = conn.prepareStatement(sqlBase);
                ps.setInt(1, userId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    return mapRowBase(rs);
                }
            }
            return null;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void update(Profile profile) {
        String sqlFull = "UPDATE profiles SET first_name=?, last_name=?, phone=?, email=?, address=?, city=?, state=?, zip=?, " +
                " name_on_card=?, card_number_last4=?, exp_month=?, exp_year=?, billing_address=?, billing_city=?, billing_state=?, billing_zip=?, billing_country=?, delivery_country=? " +
                " WHERE user_id=?";
        String sqlBase = "UPDATE profiles SET first_name=?, last_name=?, phone=?, email=?, address=?, city=?, state=?, zip=?, " +
                " name_on_card=?, card_number_last4=?, exp_month=?, exp_year=?, billing_address=?, billing_city=?, billing_state=?, billing_zip=?, billing_country=? " +
                " WHERE user_id=?";
        try (Connection conn = getConnection()) {
            try {
                PreparedStatement ps = conn.prepareStatement(sqlFull);
                ps.setString(1, profile.getFirstName());
                ps.setString(2, profile.getLastName());
                ps.setString(3, profile.getPhone());
                ps.setString(4, profile.getEmail());
                ps.setString(5, profile.getAddress());
                ps.setString(6, profile.getCity());
                ps.setString(7, profile.getState());
                ps.setString(8, profile.getZip());
                ps.setString(9, profile.getNameOnCard());
                ps.setString(10, profile.getCardNumberLast4());
                ps.setString(11, profile.getExpMonth());
                ps.setString(12, profile.getExpYear());
                ps.setString(13, profile.getBillingAddress());
                ps.setString(14, profile.getBillingCity());
                ps.setString(15, profile.getBillingState());
                ps.setString(16, profile.getBillingZip());
                ps.setString(17, profile.getBillingCountry());
                ps.setString(18, profile.getDeliveryCountry());
                ps.setInt(19, profile.getUserId());
                ps.executeUpdate();
            } catch (SQLException e) {
                if (e.getMessage() != null && e.getMessage().contains("delivery_country")) {
                    PreparedStatement ps = conn.prepareStatement(sqlBase);
                    ps.setString(1, profile.getFirstName());
                    ps.setString(2, profile.getLastName());
                    ps.setString(3, profile.getPhone());
                    ps.setString(4, profile.getEmail());
                    ps.setString(5, profile.getAddress());
                    ps.setString(6, profile.getCity());
                    ps.setString(7, profile.getState());
                    ps.setString(8, profile.getZip());
                    ps.setString(9, profile.getNameOnCard());
                    ps.setString(10, profile.getCardNumberLast4());
                    ps.setString(11, profile.getExpMonth());
                    ps.setString(12, profile.getExpYear());
                    ps.setString(13, profile.getBillingAddress());
                    ps.setString(14, profile.getBillingCity());
                    ps.setString(15, profile.getBillingState());
                    ps.setString(16, profile.getBillingZip());
                    ps.setString(17, profile.getBillingCountry());
                    ps.setInt(18, profile.getUserId());
                    ps.executeUpdate();
                } else {
                    throw e;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private Profile mapRow(ResultSet rs) throws SQLException {
        Profile p = mapRowBase(rs);
        try {
            p.setNameOnCard(rs.getString("name_on_card"));
            p.setCardNumberLast4(rs.getString("card_number_last4"));
            p.setExpMonth(rs.getString("exp_month"));
            p.setExpYear(rs.getString("exp_year"));
            p.setBillingAddress(rs.getString("billing_address"));
            p.setBillingCity(rs.getString("billing_city"));
            p.setBillingState(rs.getString("billing_state"));
            p.setBillingZip(rs.getString("billing_zip"));
            p.setBillingCountry(rs.getString("billing_country"));
            p.setDeliveryCountry(rs.getString("delivery_country"));
        } catch (SQLException ignored) { }
        return p;
    }

    private Profile mapRowBase(ResultSet rs) throws SQLException {
        Profile p = new Profile();
        p.setUserId(rs.getInt("user_id"));
        p.setFirstName(rs.getString("first_name"));
        p.setLastName(rs.getString("last_name"));
        p.setPhone(rs.getString("phone"));
        p.setEmail(rs.getString("email"));
        p.setAddress(rs.getString("address"));
        p.setCity(rs.getString("city"));
        p.setState(rs.getString("state"));
        p.setZip(rs.getString("zip"));
        return p;
    }

}

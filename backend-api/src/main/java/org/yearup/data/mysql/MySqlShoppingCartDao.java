package org.yearup.data.mysql;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.yearup.data.ShoppingCartDao;
import org.yearup.models.Product;
import org.yearup.models.ShoppingCart;
import org.yearup.models.ShoppingCartItem;
import org.yearup.models.User;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.*;

@Component // Registers this class as a spring bean
public class MySqlShoppingCartDao extends MySqlDaoBase implements ShoppingCartDao {

    // Constructor injection of the DataSource
    @Autowired
    public MySqlShoppingCartDao(DataSource dataSource) {
        // pass the DataSource to the base (DAO) class
        super(dataSource);
    }

    @Override
    public ShoppingCart getCartByUserId(int userId) {

        ShoppingCart cart = new ShoppingCart();
        // retrieves all cart items and joins product data to populate
        String sql = """
        SELECT *
        FROM shopping_cart
        JOIN products USING (product_id)
        WHERE user_id = ?;
        """;

        try (Connection connection = super.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql)
        ) {
            //binds user ID so this is theonly cart retrieved
            preparedStatement.setInt(1, userId);
            // Executes
            ResultSet resultSet = preparedStatement.executeQuery();
            // Loops through each row in the result set
            while (resultSet.next())
            {
                ShoppingCartItem item = new ShoppingCartItem();

                // maps product columns into a Product object
                item.setProduct(mapRow(resultSet));

                // set the quantity from the shopping_cart table
                item.setQuantity(resultSet.getInt("quantity"));

                cart.add(item);
            }

            return cart;
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
    }

    @Override
    public ShoppingCart addProduct(ShoppingCartItem item, User user)
    {
        // checks if the product exists in cartt
        String selectSql = """
            SELECT quantity
            FROM shopping_cart
            WHERE user_id = ? AND product_id = ?
            """;

        // inserts a new product
        String insertSql = """
            INSERT INTO shopping_cart (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            """;

        // updates the quantity
        String updateSql = """
            UPDATE shopping_cart
            SET quantity = ?
            WHERE user_id = ? AND product_id = ?
            """;

        try (Connection connection = getConnection())
        {
            // checks if product exists in cart
            PreparedStatement select = connection.prepareStatement(selectSql);
            select.setInt(1, user.getId());          // Bind user ID
            select.setInt(2, item.getProductId());  // Bind product ID

            ResultSet resultSet = select.executeQuery();

            if (resultSet.next())
            {
                // if product already exists - ass to the quantity
                int newQuantity = resultSet.getInt("quantity") + item.getQuantity();

                PreparedStatement update = connection.prepareStatement(updateSql);
                update.setInt(1, newQuantity);       // New quantity
                update.setInt(2, user.getId());      // User constraint
                update.setInt(3, item.getProductId()); // Product constraint
                update.executeUpdate();
            }
            else
            {
                // if product does not exist - new row
                PreparedStatement insert = connection.prepareStatement(insertSql);
                insert.setInt(1, user.getId());
                insert.setInt(2, item.getProductId());
                insert.setInt(3, item.getQuantity());
                insert.executeUpdate();
            }

            // return updated cart
            return getCartByUserId(user.getId());
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
    }

    // NEED TO FIX - cant update cart and causes error
    @Override
    public ShoppingCart updateProductQuantity(ShoppingCartItem item, User user)
    {
        String sql = """
        UPDATE shopping_cart
        SET quantity = ?
        WHERE user_id = ? AND product_id = ?;
        """;

        try (Connection connection = super.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql))
        {
            // Set the new quantity (from the request body)
            preparedStatement.setInt(1, item.getQuantity());

            // ensure the update applies only to this user
            preparedStatement.setInt(2, user.getId());

            // ensure the update applies only to this product
            preparedStatement.setInt(3, item.getProductId());

            // execute the update and check affected rows
            int rowsUpdated = preparedStatement.executeUpdate();

            // if the update was successful - return updated cart
            if (rowsUpdated > 0)
            {
                return getCartByUserId(user.getId());
            }
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
        // returns null if no rows were updated (product not in cart)
        return null;
    }

    @Override
    public void clearCart(User user)
    {
        String sql = """
        DELETE FROM shopping_cart
        WHERE user_id = ?;
        """;

        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql))
        {
            preparedStatement.setInt(1, user.getId());
            preparedStatement.executeUpdate();
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
    }

    // maps the database row into a product object
    protected static Product mapRow(ResultSet row) throws SQLException {
        int productId = row.getInt("product_id");
        String name = row.getString("name");
        BigDecimal price = row.getBigDecimal("price");
        int categoryId = row.getInt("category_id");
        String description = row.getString("description");
        String subCategory = row.getString("subcategory");
        int stock = row.getInt("stock");
        boolean isFeatured = row.getBoolean("featured");
        String imageUrl = row.getString("image_url");

        // returns the fully populated product model
        return new Product(productId, name, price, categoryId, description, subCategory, stock, isFeatured, imageUrl);
    }
}


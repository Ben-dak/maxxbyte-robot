package org.yearup.data.mysql;

import org.springframework.stereotype.Component;
import org.yearup.data.CategoryDao;
import org.yearup.models.Category;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Component
// Registers this DAO as a Spring bean for injection
public class MySqlCategoryDao extends MySqlDaoBase implements CategoryDao
{
    public MySqlCategoryDao(DataSource dataSource)
    {
        super(dataSource);
        // Passes DataSource to the base class
    }

    @Override
    public List<Category> getAllCategories()
    {
        List<Category> categories = new ArrayList<>();
        // holds all categories from the database

        String sql = """
            SELECT category_id, name, description
            FROM categories
            """;
        // query to retrieve all categories

        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql);
             ResultSet resultSet = preparedStatement.executeQuery())
        // try-with resources (automatically closes database resources)
        {
            while (resultSet.next())
            {
                categories.add(mapRow(resultSet));
                // Converts each row into a Category object
            }
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
        return categories;
    }

    @Override
    public Category getById(int categoryId)
    {
        String sql = """
            SELECT category_id, name, description
            FROM categories WHERE category_id = ?
            """;

        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql))
        {
            preparedStatement.setInt(1, categoryId);
            // Safely inject categoryId into SQL

            try (ResultSet resultSet = preparedStatement.executeQuery())
            {
                if (resultSet.next())
                {
                    return mapRow(resultSet);
                    // Return the category
                }
            }
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }

        return null;
    }

    @Override
    public Category create(Category category)
    {
        String sql = """
            INSERT INTO categories (name, description)
            VALUES (?, ?)
            """;

        try (Connection connection = getConnection();
             PreparedStatement preparedStatement =
                     connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS))
        {
            preparedStatement.setString(1, category.getName());
            preparedStatement.setString(2, category.getDescription());
            // Fill placeholders

            preparedStatement.executeUpdate();
            // executes INSERT

            try (ResultSet keys = preparedStatement.getGeneratedKeys())
            {
                if (keys.next())
                {
                    category.setCategoryId(keys.getInt(1));
                    // Stores generated primary key
                }
            }
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }

        return category;
    }

    @Override
    public void update(int categoryId, Category category)
    {
        String sql = """
            UPDATE categories
            SET name = ?, description = ?
            WHERE category_id = ?
            """;

        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql))
        {
            preparedStatement.setString(1, category.getName());
            preparedStatement.setString(2, category.getDescription());
            preparedStatement.setInt(3, categoryId);

            preparedStatement.executeUpdate();
            // Executes UPDATE
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void delete(int categoryId)
    {
        String sql = """
            DELETE FROM categories
            WHERE category_id = ?
            """;

        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql))
        {
            preparedStatement.setInt(1, categoryId);
            preparedStatement.executeUpdate();
            // executes DELETE
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
    }

    private Category mapRow(ResultSet row) throws SQLException
    {
        Category category = new Category();

        category.setCategoryId(row.getInt("category_id"));
        category.setName(row.getString("name"));
        category.setDescription(row.getString("description"));
        // Map database columns to object fields

        return category;
    }
}



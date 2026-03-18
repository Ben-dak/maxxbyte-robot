package org.yearup.data;

import org.yearup.models.Category;
import java.util.List;

public interface CategoryDao
{
    List<Category> getAllCategories();
    /** Returns categories with map coordinates; falls back to getAllCategories if map columns missing. */
    List<Category> getCategoriesForMap();
    Category getById(int categoryId);
    Category create(Category category);
    void update(int categoryId, Category category);
    void delete(int categoryId);
}

package org.yearup.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yearup.data.CategoryDao;
import org.yearup.data.ProductDao;
import org.yearup.models.Category;
import org.yearup.models.Product;

import java.util.List;


@RestController
// Tells Spring this class handles REST requests and returns JSON
@RequestMapping("/categories")
// Base URL for all endpoints in this controller
public class CategoriesController
{
    private CategoryDao categoryDao;
    // Reference to Category data access object

    private ProductDao productDao;
    // Reference to Category data access object

    @Autowired
    // Constructor injection (Spring supplies the DAO implementations)
    public CategoriesController(CategoryDao categoryDao, ProductDao productDao)
    {
        this.categoryDao = categoryDao;
        this.productDao = productDao;
    }

    @GetMapping("/{id}")
    // Handles GET requests  in insomnia like: /categories/3
    public Category getById(@PathVariable int id)
    // @PathVariable pulls the {id} value from the URL above
    {
        return categoryDao.getById(id);
        // find and return a category by ID
    }

    @GetMapping("{categoryId}/products")
    // Handles GET requests  in insomnia like: /categories/3/products
    public List<Product> getProductsById(@PathVariable int categoryId)
    {
        return productDao.listByCategoryId(categoryId);
        // Returns all products that belong to the given category
    }

    @PostMapping
    // Handles POST requests in insomnia like /categories
    @PreAuthorize("hasRole('ADMIN')")
    // Only users with ADMIN role may call this
    public Category addCategory(@RequestBody Category category)
    // @RequestBody converts incoming JSON into a Category object
    {
        return categoryDao.create(category);
        // Save the category and return it
    }

    @PutMapping("/{id}")
    // Handles POUT requests in insomnia like /categories/5
    @PreAuthorize("hasRole('ADMIN')")
    public void updateCategory(@PathVariable int id, @RequestBody Category category)
    {
        categoryDao.update(id, category);
        // Update the existing category in the database
    }

    @DeleteMapping("/{id}")
    // Handles DELETE requests in insomnia like /categories/5
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCategory(@PathVariable int id)
    {
        categoryDao.delete(id);
        // Removes the category from the database
    }

    @GetMapping
    // Handles GET requests in insomnia like /categories
    public List<Category> getAll()
    {
        return categoryDao.getAllCategories();
        // Returns all categories
    }
}

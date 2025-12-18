package org.yearup.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.yearup.data.ProductDao;
import org.yearup.data.ShoppingCartDao;
import org.yearup.data.UserDao;
import org.yearup.models.Product;
import org.yearup.models.ShoppingCart;
import org.yearup.models.ShoppingCartItem;
import org.yearup.models.User;

import java.security.Principal;

// convert this class to a REST controller
// only logged-in users should have access to these actions
@RestController
@RequestMapping("cart")
@CrossOrigin //needed this - just learned that from my category not loading issue
public class ShoppingCartController
{
    private ShoppingCartDao shoppingCartDao;
    private UserDao userDao;
    private ProductDao productDao;

    public ShoppingCartController() {
    }

    @Autowired
    public ShoppingCartController(ShoppingCartDao shoppingCartDao, UserDao userDao,ProductDao productDao) {
        this.shoppingCartDao = shoppingCartDao;
        this.userDao = userDao;
        this.productDao = productDao; //thought this
    }

    // each method in this controller requires a Principal object as a parameter (line 42)
    @GetMapping("")
    @PreAuthorize("hasAnyRole('ADMIN','USER')") //added ADMIN bc that role will need access to everything
    public ShoppingCart getCart(Principal principal) {
        try {

            // gets the login username (Spring provides via Principal object)
            String userName = principal.getName();
            // look for users record
            User user = userDao.getByUserName(userName);
            // Looks up record to access the users ID
            int userId = user.getId();

            // Retrieves shopping cart for user (DAO handles all database interaction)
            ShoppingCart cart = shoppingCartDao.getCartByUserId(userId);

            return cart;
        } catch (Exception e)
        {
            // catches generic server error when getting it
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Oops... our bad.");
        }
    }

    // POST method
    @PostMapping("/products/{productId}")
    @ResponseStatus(value=HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ShoppingCart addItem(@PathVariable int productId, Principal principal) {

        // gets the login username
        String userName = principal.getName();

        // look for the users record
        User user = userDao.getByUserName(userName);

        // Retrieve the product being added to the cart using the path variable
        Product product = productDao.getById(productId);

        // Creates a new ShoppingCartItem to represent the item being added
        ShoppingCartItem item = new ShoppingCartItem();

        // Associates the selected product with the cart item
        item.setProduct(product);

        // adds the item to the users cart in shoppingCartDao
        return shoppingCartDao.addProduct(item,user);
    }
    // my plan for updateCarts method

    // put method
    @PutMapping("products/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ShoppingCart updateCart(@PathVariable int productId,@RequestBody ShoppingCartItem cartItem, Principal principal) {

        // gets the login username
        String userName = principal.getName();

        // look for the users record
        User user = userDao.getByUserName(userName);

        // Retrieve the product being added to the cart using the path variable
        Product product = productDao.getById(productId);

        // Retrieves cart then ensures the update applies to the correct one
        ShoppingCart shoppingCart = shoppingCartDao.getCartByUserId(user.getId());

        // This was causing some issues - it made the new "item" be used below
        // ShoppingCartItem item = new ShoppingCartItem();

        // Associate the selected product with the cart item
        cartItem.setProduct(product);

        // updates/adds item to the users cart in shoppingCartDao
        shoppingCartDao.addProduct(cartItem, user);

        return shoppingCart;
    }

    @DeleteMapping("")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart(Principal principal)
    {
        // gets logged-in username
        String userName = principal.getName();

        // findss user record
        User user = userDao.getByUserName(userName);

        // clears cart for this user
        shoppingCartDao.clearCart(user);
    }

    // my plan for new clearCart method
    // Default Note: add a DELETE method to clear all products from the current users cart - https://localhost:8080/cart

    // gets the login username
    // look for the users record
    // Retrieve the product that is needed to delete
    // Clear the cart for the user
}


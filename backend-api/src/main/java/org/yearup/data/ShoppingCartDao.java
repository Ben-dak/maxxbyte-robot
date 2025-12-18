package org.yearup.data;

import org.yearup.models.ShoppingCart;
import org.yearup.models.ShoppingCartItem;
import org.yearup.models.User;

public interface ShoppingCartDao {
    ShoppingCart getCartByUserId(int userId);
    ShoppingCart addProduct(ShoppingCartItem item, User user);
    ShoppingCart updateProductQuantity(ShoppingCartItem item, User user);
    // Updates existing item in a users shopping cart (says no usages as I use-
    // "addProduct" in controller to update over the currently added
    void clearCart(User user);
}


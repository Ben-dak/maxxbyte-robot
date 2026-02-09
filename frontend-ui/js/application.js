
function showLoginForm()
{
    templateBuilder.build('login-form', { loginImage: config.assets.login }, 'login');
}

function hideModalForm()
{
    templateBuilder.clear('login');
}

function login()
{
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    userService.login(username, password);
    hideModalForm();
}

function showImageDetailForm(product, imageUrl)
{
    const imageDetail = {
        name: product,
        imageUrl: imageUrl
    };

    templateBuilder.build('image-detail', imageDetail, 'login');
}

function loadHome()
{
    document.body.classList.remove('restaurant-view');
    const data = {
        image1: config.assets.homeImage1,
        image2: config.assets.homeImage2,
        logo: config.assets.logo,
        heroFoodImage: config.assets.heroFoodImage || config.assets.butterChickenImage,
        heroBackgroundImage: config.assets.homeHeroBackground || ''
    };
    templateBuilder.build('home', data, 'main');
}

function scrollToMenu()
{
    const section = document.getElementById("menu-section");
    if(section)
    {
        section.scrollIntoView({ behavior: "smooth" });
    }
}

function editProfile()
{
    profileService.loadProfile();
}

function saveProfile()
{
    const cardNumberRaw = document.getElementById("cardNumber")?.value?.trim() || '';
    const cardNumberLast4 = cardNumberRaw.length >= 4 ? cardNumberRaw.slice(-4) : (cardNumberRaw.replace(/\D/g, '').slice(-4) || null);

    const profile = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        nameOnCard: document.getElementById("nameOnCard").value,
        expMonth: document.getElementById("expMonth").value,
        expYear: document.getElementById("expYear").value,
        billingAddress: document.getElementById("billingAddress").value,
        billingCity: document.getElementById("billingCity").value,
        billingState: document.getElementById("billingState").value,
        billingZip: document.getElementById("billingZip").value,
        billingCountry: document.getElementById("billingCountry").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        zip: document.getElementById("zip").value,
        deliveryCountry: document.getElementById("deliveryCountry").value
    };
    if (cardNumberLast4) profile.cardNumberLast4 = cardNumberLast4;

    profileService.updateProfile(profile);
}

function showCart()
{
    cartService.loadCartPage();
}

function showOrderForm()
{
    const totalAmount = cartService.cart.total || 0;
    templateBuilder.build('order-create', { totalAmount, paymentImage: config.assets.payment }, 'main');
}

function submitOrder()
{
    const deliveryAddress = document.getElementById("deliveryAddress").value;
    const deliveryCity = document.getElementById("deliveryCity").value;
    const deliveryState = document.getElementById("deliveryState").value;
    const deliveryZip = document.getElementById("deliveryZip").value;
    const totalAmount = document.getElementById("orderTotal").value;

    const order = {
        deliveryAddress,
        deliveryCity,
        deliveryState,
        deliveryZip,
        totalAmount
    };

    ordersService.createOrder(order)
        .then(() => {
            cartService.clearCart();
            loadOrders();
        })
        .catch(() => {
            const data = { error: "Order submission failed." };
            templateBuilder.append("error", data, "errors");
        });
}

function loadOrders()
{
    ordersService.getOrders()
        .then(response => {
            const orders = response.data || [];
            const data = {
                orders,
                hasOrders: orders.length > 0,
                orderCardImage: config.assets.orderCard
            };
            templateBuilder.build('orders', data, 'main');
        })
        .catch(() => {
            const data = { error: "Unable to load orders." };
            templateBuilder.append("error", data, "errors");
        });
}

function loadOrderDetail(orderId)
{
    ordersService.getOrderById(orderId)
        .then(response => {
            const data = {
                order: response.data,
                statusImage: config.assets.status,
                confirmationImage: config.assets.confirmation
            };
            templateBuilder.build('order-detail', data, 'main');
        })
        .catch(() => {
            const data = { error: "Unable to load order details." };
            templateBuilder.append("error", data, "errors");
        });
}

function loadRobotStatus()
{
    robotService.getRobotStatuses()
        .then(response => {
            const robots = response.data || [];
            const data = { robots, hasRobots: robots.length > 0 };
            templateBuilder.build('robot-status', data, 'main');
        })
        .catch(() => {
            const data = { error: "Unable to load robot status." };
            templateBuilder.append("error", data, "errors");
        });
}

function clearCart()
{
    cartService.clearCart();
    cartService.loadCartPage();
}

function setCategory(control)
{
    productService.addCategoryFilter(control.value);
    productService.search();
}

function setSubcategory(control)
{
    productService.addSubcategoryFilter(control.value);
    productService.search();
}

function closeError(control)
{
    setTimeout(() => {
        control.click();
    }, 3000);
}

/* ===========================
   PAGE LOAD INITIALIZATION
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
});

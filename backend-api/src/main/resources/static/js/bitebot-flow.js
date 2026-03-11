/**
 * BiteBot ordering flow: Home → Login → Restaurant → Order → Payment → Review → Order Status
 */
const TAX_RATE = 0.08;
const STATUS_UPDATE_INTERVAL_MS = 30 * 1000;         // 30 sec between status checks (was 10 min)
const STATUS_LEG_MS = 10 * 60 * 1000;                // 10 min: Order Placed → Order En Route
const STATUS_TOTAL_MS = 20 * 60 * 1000;              // 20 min total: then Order En Route → Order Arrived

const bitebotMenu = {
    taco: { id: 'taco', name: 'Taco Combo', price: 15, image: 'tacoImage' },
    butterChicken: { id: 'butterChicken', name: 'Butter Chicken', price: 15, image: 'butterChickenImage' }
};

let bitebotOrder = {
    items: [],
    payment: null,
    deliveryAddress: null,
    orderId: null,
    status: 'PLACED',
    statusScreenEnteredAt: null,
    lastOrderSnapshot: null
};
let statusLogoUpdaterIntervalId = null;

function getOrderSubtotal() {
    return bitebotOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getOrderTax() {
    return Math.round(getOrderSubtotal() * TAX_RATE * 100) / 100;
}

function getOrderTotal() {
    return getOrderSubtotal() + getOrderTax();
}

function saveOrderSnapshot() {
    if (!bitebotOrder.items.length) return;
    bitebotOrder.lastOrderSnapshot = {
        items: bitebotOrder.items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            lineTotal: (i.price * i.quantity).toFixed(2)
        })),
        subtotal: getOrderSubtotal().toFixed(2),
        tax: getOrderTax().toFixed(2),
        total: getOrderTotal().toFixed(2),
        totalItems: bitebotOrder.items.reduce((sum, i) => sum + i.quantity, 0)
    };
}

function updateHeaderCartCount() {
    const el = document.getElementById('cart-items');
    if (!el) return;
    const count = bitebotOrder.items.reduce((sum, i) => sum + i.quantity, 0);
    el.textContent = count;
}

function addToOrder(mealId) {
    const menuItem = bitebotMenu[mealId];
    if (!menuItem) return;
    const existing = bitebotOrder.items.find(i => i.id === menuItem.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        bitebotOrder.items.push({
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            imageUrl: config.assets[menuItem.image]
        });
    }
    updateHeaderCartCount();
    const checkoutBar = document.getElementById('saffron-checkout-bar');
    if (checkoutBar) {
        checkoutBar.classList.remove('saffron-checkout-bar--hidden');
    } else {
        goToOrderScreen();
    }
}

function setOrderQuantity(mealId, delta) {
    const item = bitebotOrder.items.find(i => i.id === mealId);
    if (!item) return;
    item.quantity = Math.max(0, item.quantity + delta);
    if (item.quantity === 0) {
        bitebotOrder.items = bitebotOrder.items.filter(i => i.id !== mealId);
    }
    updateHeaderCartCount();
    renderOrderScreen();
    const overlayList = document.getElementById('cart-overlay-items-list');
    if (overlayList) {
        renderCartOverlay();
        if (bitebotOrder.items.length === 0) {
            closeCartOverlay();
            const checkoutBar = document.getElementById('saffron-checkout-bar');
            if (checkoutBar) checkoutBar.classList.add('saffron-checkout-bar--hidden');
        }
    }
}

function renderOrderScreen() {
    const listEl = document.getElementById('order-items-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    bitebotOrder.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'order-item-row';
        div.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="order-item-thumb">
            <div class="order-item-info">
                <strong>${item.name}</strong>
                <span class="order-item-price">$${item.price.toFixed(2)}</span>
            </div>
            <div class="order-item-qty">
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setOrderQuantity('${item.id}', -1)">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setOrderQuantity('${item.id}', 1)">+</button>
            </div>
        `;
        listEl.appendChild(div);
    });
    const subtotal = getOrderSubtotal();
    const tax = getOrderTax();
    const total = getOrderTotal();
    const subtotalEl = document.getElementById('order-subtotal');
    const taxesEl = document.getElementById('order-taxes');
    const totalEl = document.getElementById('order-total');
    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (taxesEl) taxesEl.textContent = '$' + tax.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
}

window.openCartOverlay = function() {
    const backdrop = document.getElementById('cart-overlay-backdrop');
    const panel = document.getElementById('cart-overlay-panel');
    if (!backdrop || !panel) return;
    renderCartOverlay();
    backdrop.classList.remove('cart-overlay-backdrop--hidden');
    panel.classList.remove('cart-overlay-panel--hidden');
};

window.closeCartOverlay = function() {
    const backdrop = document.getElementById('cart-overlay-backdrop');
    const panel = document.getElementById('cart-overlay-panel');
    if (backdrop) backdrop.classList.add('cart-overlay-backdrop--hidden');
    if (panel) panel.classList.add('cart-overlay-panel--hidden');
};

function renderCartOverlay() {
    const listEl = document.getElementById('cart-overlay-items-list');
    const subtotalEl = document.getElementById('cart-overlay-subtotal');
    const taxEl = document.getElementById('cart-overlay-tax');
    const totalEl = document.getElementById('cart-overlay-total');
    const checkoutBtn = document.getElementById('cart-overlay-checkout-btn');
    
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (bitebotOrder.items.length === 0) {
        listEl.innerHTML = '<p class="cart-empty-message">Your cart is empty</p>';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (taxEl) taxEl.textContent = '$0.00';
        if (totalEl) totalEl.textContent = '$0.00';
        if (checkoutBtn) checkoutBtn.style.display = 'none';
        return;
    }
    
    if (checkoutBtn) checkoutBtn.style.display = '';
    
    bitebotOrder.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-overlay-item-row';
        div.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="cart-overlay-item-thumb">
            <div class="cart-overlay-item-info">
                <p class="cart-overlay-item-name">${item.name}</p>
                <p class="cart-overlay-item-price">$${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-overlay-item-qty">
                <button type="button" onclick="setOrderQuantity('${item.id}', -1)">−</button>
                <span class="cart-overlay-qty-value">${item.quantity}</span>
                <button type="button" onclick="setOrderQuantity('${item.id}', 1)">+</button>
            </div>
        `;
        listEl.appendChild(div);
    });
    
    const subtotal = getOrderSubtotal();
    const tax = getOrderTax();
    const total = getOrderTotal();
    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (taxEl) taxEl.textContent = '$' + tax.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
    if (checkoutBtn) checkoutBtn.textContent = 'CHECK OUT - $' + total.toFixed(2);
}

function cartOverlayGoToCheckout() {
    closeCartOverlay();
    goToBitebotCheckoutScreen();
}

function goToLoginScreen() {
    const loginImg = config.assets.loginFood || config.assets.homeHeroBackground || 'images/logo/homescreen-background.jpg';
    const loginImgPng = config.assets.loginFoodPng || loginImg.replace(/\.jpg$/i, '.png');
    const fallbackImg = config.assets.homeHeroBackground || 'images/logo/homescreen-background.jpg';
    const cacheBust = '?v=' + (Date.now ? Date.now() : 1);
    templateBuilder.build('login-screen', {
        loginLeftImage: loginImg + cacheBust,
        loginLeftImagePng: loginImgPng,
        loginFallbackImage: fallbackImg,
        logoUrl: config.assets.logo
    }, 'main');
}

function goToRegisterScreen() {
    const username = (typeof userService !== 'undefined' && userService.getUserName()) ? userService.getUserName() : 'Guest';
    templateBuilder.build('create-account-screen', {
        logoUrl: config.assets.logo || '',
        username: username
    }, 'main');
}

/** If already logged in, go to restaurant; otherwise show login. Use for START YOUR ORDER and DELIVERY. */
function startOrderOrLogin() {
    if (typeof userService !== 'undefined' && userService.isLoggedIn()) {
        goToRestaurantScreen();
    } else {
        goToLoginScreen();
    }
}

/** Same as startOrderOrLogin: logged-in users go to restaurant; others see login. */
function deliveryOrLogin() {
    startOrderOrLogin();
}

const PRESET_DELIVERY_LOCATIONS = {
    'campus-north': {
        address: '100 University Ave',
        city: 'San Jose',
        zip: '95112',
        state: 'CA',
        country: 'USA',
        cardNumber: '4111 1111 1111 1111',
        exp: '12/28',
        cvv: '123',
        billingAddress: '100 University Ave',
        billingCity: 'San Jose',
        billingZip: '95112',
        billingState: 'CA',
        billingCountry: 'USA'
    },
    'campus-south': {
        address: '200 College Blvd',
        city: 'San Jose',
        zip: '95113',
        state: 'CA',
        country: 'USA',
        cardNumber: '4222 2222 2222 2222',
        exp: '06/27',
        cvv: '456',
        billingAddress: '200 College Blvd',
        billingCity: 'San Jose',
        billingZip: '95113',
        billingState: 'CA',
        billingCountry: 'USA'
    },
    'downtown': {
        address: '50 Main Street',
        city: 'San Jose',
        zip: '95110',
        state: 'CA',
        country: 'USA',
        cardNumber: '4333 3333 3333 3333',
        exp: '09/26',
        cvv: '789',
        billingAddress: '50 Main Street',
        billingCity: 'San Jose',
        billingZip: '95110',
        billingState: 'CA',
        billingCountry: 'USA'
    },
    'tech-park': {
        address: '300 Innovation Dr',
        city: 'San Jose',
        zip: '95134',
        state: 'CA',
        country: 'USA',
        cardNumber: '4444 4444 4444 4444',
        exp: '03/29',
        cvv: '321',
        billingAddress: '300 Innovation Dr',
        billingCity: 'San Jose',
        billingZip: '95134',
        billingState: 'CA',
        billingCountry: 'USA'
    }
};

window.fillAddressFromSelection = function() {
    const select = document.getElementById('register-deliveryAddress');
    const locationKey = select?.value;
    const location = PRESET_DELIVERY_LOCATIONS[locationKey];
    
    if (location) {
        document.getElementById('register-city').value = location.city;
        document.getElementById('register-zip').value = location.zip;
        document.getElementById('register-state').value = location.state;
        document.getElementById('register-country').value = location.country;
        document.getElementById('register-cardNumber').value = location.cardNumber;
        document.getElementById('register-exp').value = location.exp;
        document.getElementById('register-cvv').value = location.cvv;
        document.getElementById('register-billingAddress').value = location.billingAddress;
        document.getElementById('register-billingCity').value = location.billingCity;
        document.getElementById('register-billingZip').value = location.billingZip;
        document.getElementById('register-billingState').value = location.billingState;
        document.getElementById('register-billingCountry').value = location.billingCountry;
    } else {
        document.getElementById('register-city').value = '';
        document.getElementById('register-zip').value = '';
        document.getElementById('register-state').value = '';
        document.getElementById('register-country').value = '';
        document.getElementById('register-cardNumber').value = '';
        document.getElementById('register-exp').value = '';
        document.getElementById('register-cvv').value = '';
        document.getElementById('register-billingAddress').value = '';
        document.getElementById('register-billingCity').value = '';
        document.getElementById('register-billingZip').value = '';
        document.getElementById('register-billingState').value = '';
        document.getElementById('register-billingCountry').value = '';
    }
};

function registerAndGoToRestaurant() {
    const firstName = document.getElementById('register-firstName')?.value?.trim();
    const lastName = document.getElementById('register-lastName')?.value?.trim();
    const deliveryAddress = document.getElementById('register-deliveryAddress')?.value;
    const username = document.getElementById('register-username')?.value?.trim();
    const password = document.getElementById('register-password')?.value;
    const confirm = document.getElementById('register-confirm')?.value;
    const errEl = document.getElementById('register-error');
    
    if (!firstName || !lastName) {
        if (errEl) errEl.textContent = 'Please enter your first and last name.';
        return;
    }
    if (!deliveryAddress) {
        if (errEl) errEl.textContent = 'Please select a delivery location.';
        return;
    }
    if (!username || !password || !confirm) {
        if (errEl) errEl.textContent = 'Please fill in email and password fields.';
        return;
    }
    if (password !== confirm) {
        if (errEl) errEl.textContent = 'Password and confirmation do not match.';
        return;
    }
    if (errEl) errEl.textContent = '';
    
    const profileData = {
        firstName: firstName,
        lastName: lastName,
        address: document.getElementById('register-city')?.value + ', ' + document.getElementById('register-state')?.value,
        city: document.getElementById('register-city')?.value,
        state: document.getElementById('register-state')?.value,
        zip: document.getElementById('register-zip')?.value,
        deliveryCountry: document.getElementById('register-country')?.value
    };
    
    const url = `${config.baseUrl}/auth/register`;
    axios.post(url, {
        username: username,
        password: password,
        confirmPassword: confirm,
        role: 'ROLE_CUSTOMER'
    })
        .then(() => {
            return axios.post(`${config.baseUrl}/auth/login`, { username, password });
        })
        .then(response => {
            const data = response.data;
            if (data && typeof userService !== 'undefined') {
                userService.saveUser(data);
                userService.setHeaderLogin();
                const token = data.token || data.jwt;
                if (token) axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                
                return axios.put(`${config.baseUrl}/profile`, profileData)
                    .then(() => data)
                    .catch(() => data);
            }
            return data;
        })
        .then(data => {
            if (typeof productService !== 'undefined' && productService.enableButtons) productService.enableButtons();
            goToRestaurantScreen();
        })
        .catch(err => {
            const msg = (err.response && err.response.data && (err.response.data.message || err.response.data.error)) || err.response?.status === 400 ? 'Username may already exist.' : 'Registration failed.';
            if (errEl) errEl.textContent = msg;
        });
}

function loginAndGoToRestaurant() {
    const username = document.getElementById('login-username')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    const errEl = document.getElementById('login-error');
    if (!username || !password) {
        if (errEl) errEl.textContent = 'Please enter username and password.';
        return;
    }
    if (errEl) errEl.textContent = '';
    const url = `${config.baseUrl}/auth/login`;
    axios.post(url, { username, password })
        .then(response => {
            const data = response.data;
            if (data && typeof userService !== 'undefined') {
                userService.saveUser(data);
                userService.setHeaderLogin();
                const token = data.token || data.jwt;
                if (token) axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                if (typeof productService !== 'undefined' && productService.enableButtons) productService.enableButtons();
                goToRestaurantScreen();
            } else {
                goToRestaurantScreen();
            }
        })
        .catch(() => {
            if (errEl) errEl.textContent = 'Login failed. Please check your email and password.';
        });
}

function goToRestaurantScreen() {
    document.body.classList.add('restaurant-view');
    document.body.classList.add('on-menu-page');
    const data = {
        restaurantLogo: config.assets.restaurantLogo,
        tacoImage: config.assets.tacoImage,
        butterChickenImage: config.assets.butterChickenImage
    };
    templateBuilder.build('restaurant-screen', data, 'main', function () {
        updateHeaderCartCount();
    });
    const checkoutBar = document.getElementById('saffron-checkout-bar');
    if (checkoutBar && bitebotOrder.items.length > 0) {
        checkoutBar.classList.remove('saffron-checkout-bar--hidden');
    }
}

function goToOrderScreen() {
    document.body.classList.remove('restaurant-view');
    document.body.classList.remove('on-menu-page');
    templateBuilder.build('order-screen', {}, 'main');
    setTimeout(renderOrderScreen, 50);
}

function fillCheckoutCardAndAddress(data) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val != null && val !== '') el.value = String(val);
    };
    set('cardNumber', data.cardNumberDisplay);
    set('expMonth', data.expMonth);
    set('expYear', data.expYear);
    set('billingZip', data.billingZip);
    set('deliveryAddress', data.deliveryLine1);
    set('deliveryCity', data.deliveryCity);
    set('deliveryState', data.deliveryState);
    set('deliveryZip', data.deliveryZip);
}

function goToBitebotCheckoutScreen() {
    if (!bitebotOrder.items.length) {
        const errEl = document.getElementById('errors');
        if (errEl) errEl.innerHTML = '<div class="alert alert-warning">Add at least one item to your order.</div>';
        return;
    }
    const subtotal = getOrderSubtotal();
    const tax = getOrderTax();
    const total = getOrderTotal();
    const username = (typeof userService !== 'undefined' && userService.getUserName()) ? userService.getUserName() : 'Guest';
    const itemCount = bitebotOrder.items.reduce((sum, i) => sum + i.quantity, 0);
    const itemCountText = itemCount + ' ' + (itemCount === 1 ? 'Item' : 'Items');
    const getCheckoutData = (profile) => {
        const p = profile || {};
        const hasAny = p.nameOnCard || p.billingAddress || p.address || p.email || p.cardNumberLast4;
        const defaultPayment = {
            cardNumberDisplay: '4111 1111 1111 1111',
            expMonth: '12',
            expYear: '28',
            billingZip: '75001'
        };
        const paymentData = hasAny ? {
            cardNumberDisplay: (p.cardNumberLast4) ? '•••• ' + p.cardNumberLast4 : (p.cardNumber || defaultPayment.cardNumberDisplay),
            expMonth: p.expMonth || defaultPayment.expMonth,
            expYear: (p.expYear && p.expYear.length === 4) ? p.expYear.slice(-2) : (p.expYear || defaultPayment.expYear),
            billingZip: p.billingZip || p.zip || defaultPayment.billingZip
        } : defaultPayment;
        const addr = p.address || p.billingAddress || '12345 SESAME ST';
        const city = p.city || p.billingCity || 'LALA LAND';
        const state = p.state || p.billingState || 'TX';
        const zip = p.zip || p.billingZip || '90210';
        bitebotOrder.deliveryAddress = { address: addr, city, state, zip };
        const orderItems = bitebotOrder.items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price.toFixed(2),
            lineTotal: (i.price * i.quantity).toFixed(2)
        }));
        return {
            logoUrl: config.assets.logo || '',
            username,
            itemCount,
            itemCountText,
            orderItems,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            deliveryLine1: addr,
            deliveryLine2: city + ', ' + state + ' ' + zip,
            deliveryCity: city,
            deliveryState: state,
            deliveryZip: zip,
            ...paymentData
        };
    };
    const loadThenShow = () => {
        const fromProfile = (typeof profileService !== 'undefined' && profileService.lastProfile) ? profileService.lastProfile : null;
        const fromSession = bitebotOrder.payment;
        const data = getCheckoutData(fromProfile || fromSession);
        templateBuilder.build('bitebot-checkout-screen', data, 'main', () => {
            document.body.classList.add('bitebot-checkout-active');
            fillCheckoutCardAndAddress(data);
        }, true);
    };
    if (typeof profileService !== 'undefined') {
        profileService.loadProfileForFlow().then(loadThenShow).catch(loadThenShow);
    } else {
        loadThenShow();
    }
}

function toggleOrderItemsExpand() {
    const dropdown = document.getElementById('order-items-dropdown');
    const expander = document.querySelector('.bitebot-checkout-order-expander');
    if (!dropdown || !expander) return;
    const isHidden = dropdown.hidden;
    dropdown.hidden = !isHidden;
    expander.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    expander.classList.toggle('bitebot-checkout-order-expander--open', isHidden);
}

function returnToCartFromCheckout() {
    document.body.classList.remove('bitebot-checkout-active');
    goToRestaurantScreen();
    setTimeout(openCartOverlay, 100);
}

function editDeliveryFromCheckout() {
    returnToCartFromCheckout();
}

function placeOrderFromCheckoutScreen() {
    bitebotOrder.orderError = null;
    const cardNumber = document.getElementById('cardNumber')?.value?.trim() || '';
    const getVal = id => document.getElementById(id)?.value?.trim() || '';
    bitebotOrder.deliveryAddress = {
        address: getVal('deliveryAddress'),
        city: getVal('deliveryCity'),
        state: getVal('deliveryState'),
        zip: getVal('deliveryZip')
    };
    const delivery = bitebotOrder.deliveryAddress;
    const payment = {
        nameOnCard: '',
        cardNumber: cardNumber,
        cardNumberLast4: cardNumber.length >= 4 ? cardNumber.slice(-4) : '',
        expMonth: document.getElementById('expMonth')?.value?.trim() || '',
        expYear: document.getElementById('expYear')?.value?.trim() || '',
        billingZip: document.getElementById('billingZip')?.value?.trim() || '',
        billingAddress: delivery.address || '',
        billingCity: delivery.city || '',
        billingState: delivery.state || '',
        billingZip: delivery.zip || ''
    };
    bitebotOrder.payment = payment;
    document.body.classList.remove('bitebot-checkout-active');
    document.body.classList.add('has-active-order');
    bitebotOrder.status = 'PLACED';
    bitebotOrder.statusScreenEnteredAt = Date.now();
    if (typeof campusMap !== 'undefined' && campusMap.resetDelivered) campusMap.resetDelivered();
    saveOrderSnapshot();
    goToOrderPlacedScreen();
    submitOrderInBackground();
}

function goToPaymentScreen() {
    if (!bitebotOrder.items.length) {
        const errEl = document.getElementById('errors');
        if (errEl) errEl.innerHTML = '<div class="alert alert-warning">Add at least one item to your order.</div>';
        return;
    }
    const getPaymentFormData = (profile) => {
        const p = profile || {};
        const hasAny = p.nameOnCard || p.billingAddress || p.address || p.email || p.cardNumberLast4;
        const defaultPayment = {
            nameOnCard: 'Cardholder Name',
            cardNumberDisplay: '4111 1111 1111 1111',
            expMonth: '12',
            expYear: '2028',
            billingAddress: '123 Main St',
            billingCity: 'Dallas',
            billingState: 'TX',
            billingZip: '75001',
            billingCountry: 'USA',
            email: 'you@example.com'
        };
        if (hasAny) {
            return {
                nameOnCard: p.nameOnCard || '',
                cardNumberDisplay: (p.cardNumberLast4) ? '•••• ' + p.cardNumberLast4 : (p.cardNumber || ''),
                expMonth: p.expMonth || '',
                expYear: p.expYear || '',
                billingAddress: p.billingAddress || p.address || '',
                billingCity: p.billingCity || p.city || '',
                billingState: p.billingState || p.state || '',
                billingZip: p.billingZip || p.zip || '',
                billingCountry: p.billingCountry || '',
                email: p.email || ''
            };
        }
        return defaultPayment;
    };
    const fillPaymentFormInputs = (data) => {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        set('nameOnCard', data.nameOnCard);
        set('cardNumber', data.cardNumberDisplay);
        set('expMonth', data.expMonth);
        set('expYear', data.expYear);
        set('billingAddress', data.billingAddress);
        set('billingCity', data.billingCity);
        set('billingState', data.billingState);
        set('billingZip', data.billingZip);
        set('billingCountry', data.billingCountry);
        set('paymentEmail', data.email);
    };
    const loadThenShow = () => {
        const fromProfile = (typeof profileService !== 'undefined' && profileService.lastProfile) ? profileService.lastProfile : null;
        const fromSession = bitebotOrder.payment;
        const data = getPaymentFormData(fromProfile || fromSession);
        templateBuilder.build('payment-screen', data, 'main', () => fillPaymentFormInputs(data));
    };
    if (typeof profileService !== 'undefined') {
        profileService.loadProfileForFlow().then(loadThenShow).catch(loadThenShow);
    } else {
        loadThenShow();
    }
}

function confirmPaymentAndGoToReview() {
    const cardNumber = document.getElementById('cardNumber')?.value?.trim() || '';
    const payment = {
        nameOnCard: document.getElementById('nameOnCard')?.value?.trim() || '',
        cardNumber: cardNumber,
        cardNumberLast4: cardNumber.length >= 4 ? cardNumber.slice(-4) : '',
        expMonth: document.getElementById('expMonth')?.value?.trim() || '',
        expYear: document.getElementById('expYear')?.value?.trim() || '',
        billingAddress: document.getElementById('billingAddress')?.value?.trim() || '',
        billingCity: document.getElementById('billingCity')?.value?.trim() || '',
        billingCountry: document.getElementById('billingCountry')?.value?.trim() || '',
        billingState: document.getElementById('billingState')?.value?.trim() || '',
        billingZip: document.getElementById('billingZip')?.value?.trim() || '',
        email: document.getElementById('paymentEmail')?.value?.trim() || ''
    };
    bitebotOrder.payment = payment;
    bitebotOrder.deliveryAddress = {
        address: payment.billingAddress,
        city: payment.billingCity,
        state: payment.billingState,
        zip: payment.billingZip
    };
    try {
        if (typeof profileService !== 'undefined') {
            const profilePayload = {
                nameOnCard: payment.nameOnCard,
                cardNumberLast4: payment.cardNumberLast4,
                expMonth: payment.expMonth,
                expYear: payment.expYear,
                billingAddress: payment.billingAddress,
                billingCity: payment.billingCity,
                billingState: payment.billingState,
                billingZip: payment.billingZip,
                billingCountry: payment.billingCountry,
                email: payment.email,
                address: payment.billingAddress,
                city: payment.billingCity,
                state: payment.billingState,
                zip: payment.billingZip
            };
            profileService.lastProfile = Object.assign(profileService.lastProfile || {}, profilePayload);
            profileService.updateProfile(profilePayload).catch(function() {});
        }
    } catch (e) {
        console.warn('Profile update skipped', e);
    }
    goToReviewScreen();
}

function goToReviewScreen() {
    templateBuilder.build('review-screen', {}, 'main');
    setTimeout(renderReviewScreen, 50);
}

function renderReviewScreen() {
    const itemsEl = document.getElementById('review-order-items');
    if (itemsEl) {
        itemsEl.innerHTML = bitebotOrder.items.map(i =>
            `<div class="review-item">${i.name} × ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}</div>`
        ).join('');
    }
    const subtotal = getOrderSubtotal();
    const tax = getOrderTax();
    const total = getOrderTotal();
    const el = id => document.getElementById(id);
    if (el('review-subtotal')) el('review-subtotal').textContent = '$' + subtotal.toFixed(2);
    if (el('review-taxes')) el('review-taxes').textContent = '$' + tax.toFixed(2);
    if (el('review-total')) el('review-total').textContent = '$' + total.toFixed(2);
    const p = bitebotOrder.payment || {};
    const paymentEl = document.getElementById('review-payment-full');
    if (paymentEl) {
        const last4 = p.cardNumberLast4 || (p.cardNumber && p.cardNumber.length >= 4 ? p.cardNumber.slice(-4) : '');
        paymentEl.innerHTML = [
            p.nameOnCard && `<p><strong>Name on card:</strong> ${p.nameOnCard}</p>`,
            last4 && `<p><strong>Card:</strong> •••• ${last4}</p>`,
            (p.expMonth || p.expYear) && `<p><strong>Exp:</strong> ${p.expMonth || ''}/${p.expYear || ''}</p>`,
            p.billingAddress && `<p><strong>Billing:</strong> ${p.billingAddress}, ${p.billingCity || ''}, ${p.billingState || ''} ${p.billingZip || ''}${p.billingCountry ? ', ' + p.billingCountry : ''}</p>`,
            p.email && `<p><strong>Email:</strong> ${p.email}</p>`
        ].filter(Boolean).join('') || '<p>Payment on file</p>';
    }
    const delivery = bitebotOrder.deliveryAddress;
    const profile = (typeof profileService !== 'undefined' && profileService.lastProfile) ? profileService.lastProfile : {};
    const deliveryStr = (delivery && [delivery.address, delivery.city, delivery.state, delivery.zip].filter(Boolean).join(', ')) ||
        [profile.address, profile.city, profile.state, profile.zip].filter(Boolean).join(', ') ||
        (p.billingAddress ? [p.billingAddress, p.billingCity, p.billingState, p.billingZip].filter(Boolean).join(', ') : '');
    if (el('review-delivery-address')) el('review-delivery-address').textContent = deliveryStr || '—';
}

function submitOrderInBackground() {
    const total = getOrderTotal();
    const p = bitebotOrder.payment || {};
    const delivery = bitebotOrder.deliveryAddress;
    const profile = (typeof profileService !== 'undefined' && profileService.lastProfile) ? profileService.lastProfile : {};
    const order = {
        deliveryAddress: (delivery && delivery.address) || profile.address || p.billingAddress || '',
        deliveryCity: (delivery && delivery.city) || profile.city || p.billingCity || '',
        deliveryState: (delivery && delivery.state) || profile.state || p.billingState || '',
        deliveryZip: (delivery && delivery.zip) || profile.zip || p.billingZip || '',
        totalAmount: total,
        status: 'PLACED'
    };
    if (typeof ordersService === 'undefined' || !ordersService.createOrder) {
        bitebotOrder.orderError = 'Order service is not available. Please try again later.';
        goToOrderPlacedScreen();
        return;
    }
    ordersService.createOrder(order)
        .then(response => {
            const data = response.data;
            bitebotOrder.orderId = (data && data.orderId != null) ? data.orderId : (data && data.id != null) ? data.id : null;
            saveOrderSnapshot();
            bitebotOrder.items = [];
            bitebotOrder.orderError = null;
            document.body.classList.add('has-active-order');
            if (bitebotOrder.orderId) startStatusPolling();
            const main = document.getElementById('main');
            if (main && main.querySelector('.order-placed-screen')) {
                templateBuilder.build('order-placed-screen', getOrderPlacedTemplateData(), 'main');
            }
        })
        .catch(() => {
            bitebotOrder.orderError = 'Order could not be placed. Please try again.';
            const main = document.getElementById('main');
            if (main && main.querySelector('.order-placed-screen')) {
                templateBuilder.build('order-placed-screen', getOrderPlacedTemplateData(), 'main');
            }
        });
}

function placeOrderAndGoToStatus() {
    const total = getOrderTotal();
    const p = bitebotOrder.payment || {};
    const delivery = bitebotOrder.deliveryAddress;
    const profile = (typeof profileService !== 'undefined' && profileService.lastProfile) ? profileService.lastProfile : {};
    const order = {
        deliveryAddress: (delivery && delivery.address) || profile.address || p.billingAddress || '',
        deliveryCity: (delivery && delivery.city) || profile.city || p.billingCity || '',
        deliveryState: (delivery && delivery.state) || profile.state || p.billingState || '',
        deliveryZip: (delivery && delivery.zip) || profile.zip || p.billingZip || '',
        totalAmount: total,
        status: 'PLACED'
    };
    if (typeof ordersService === 'undefined' || !ordersService.createOrder) {
        bitebotOrder.orderError = 'Order service is not available. Please try again later.';
        bitebotOrder.status = 'PLACED';
        bitebotOrder.statusScreenEnteredAt = Date.now();
        goToOrderStatusScreen();
        return;
    }
    ordersService.createOrder(order)
        .then(response => {
            const data = response.data;
            bitebotOrder.orderId = (data && data.orderId != null) ? data.orderId : (data && data.id != null) ? data.id : null;
            bitebotOrder.status = 'PLACED';
            saveOrderSnapshot();
            bitebotOrder.items = [];
            bitebotOrder.statusScreenEnteredAt = Date.now();
            if (typeof campusMap !== 'undefined' && campusMap.resetDelivered) campusMap.resetDelivered();
            bitebotOrder.orderError = null;
            document.body.classList.add('has-active-order');
            goToOrderStatusScreen();
            if (bitebotOrder.orderId) startStatusPolling();
        })
        .catch((error) => {
            const errEl = document.getElementById('errors');
            let errorMsg = 'Order could not be placed. Please try again.';
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                const serverMsg = data?.message || data?.error || (typeof data === 'string' ? data : '');
                if (status === 400) {
                    errorMsg = serverMsg || 'Invalid order data. Please check your delivery address.';
                } else if (status === 401 || status === 403) {
                    errorMsg = 'Session expired. Please sign in again.';
                } else if (status === 404) {
                    errorMsg = serverMsg || 'User not found. Please sign in again.';
                } else if (serverMsg) {
                    errorMsg = serverMsg;
                }
                console.error('Order creation failed:', status, data);
            } else if (error.request) {
                errorMsg = 'Unable to reach server. Please check your connection.';
                console.error('Order creation failed: No response from server');
            } else {
                console.error('Order creation failed:', error.message);
            }
            if (errEl) errEl.innerHTML = '<div class="alert alert-danger">' + errorMsg + '</div>';
        });
}

function getOrderStatusTemplateData() {
    const status = bitebotOrder.status || 'PLACED';
    const steps = { step1Class: '', step2Class: '', step3Class: '', connector1Class: '', connector2Class: '' };
    if (status === 'PLACED' || status === 'PENDING_ASSIGNMENT') {
        steps.step1Class = 'active';
        steps.connector1Class = 'pending';
        steps.connector2Class = 'pending';
    } else if (status === 'EN_ROUTE' || status === 'IN_TRANSIT') {
        steps.step1Class = 'done';
        steps.step2Class = 'active';
        steps.connector1Class = 'done';
        steps.connector2Class = 'pending';
    } else if (status === 'DELIVERED') {
        steps.step1Class = 'done';
        steps.step2Class = 'done';
        steps.step3Class = 'active';
        steps.connector1Class = 'done';
        steps.connector2Class = 'done';
    } else {
        steps.step1Class = 'done';
        steps.step2Class = 'done';
        steps.step3Class = 'active';
        steps.connector1Class = 'done';
        steps.connector2Class = 'done';
    }
    const username = (typeof userService !== 'undefined' && userService.getUserName()) ? userService.getUserName() : 'Guest';
    const orderId = bitebotOrder.orderId != null ? String(bitebotOrder.orderId) : '—';
    const snapshot = bitebotOrder.lastOrderSnapshot;
    const profile = (typeof profileService !== 'undefined' && profileService.lastProfile) ? profileService.lastProfile : {};
    const firstName = (profile.firstName && profile.firstName.trim()) ? profile.firstName.trim() : (username.split(/\s+/)[0] || 'Guest');
    const displayName = (profile.firstName && profile.firstName.trim()) ? profile.firstName.trim() : (username.includes('@') ? (username.split('@')[0].charAt(0).toUpperCase() + username.split('@')[0].slice(1).toLowerCase()) : firstName);
    const orderName = 'Order #' + orderId;
    let orderItems = [];
    let subtotal = '0.00';
    let tax = '0.00';
    let total = '0.00';
    let totalItems = 0;
    if (snapshot) {
        orderItems = snapshot.items;
        subtotal = snapshot.subtotal;
        tax = snapshot.tax;
        total = snapshot.total;
        totalItems = snapshot.totalItems;
    } else if (bitebotOrder.items && bitebotOrder.items.length) {
        totalItems = bitebotOrder.items.reduce((sum, i) => sum + i.quantity, 0);
        orderItems = bitebotOrder.items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            lineTotal: (i.price * i.quantity).toFixed(2)
        }));
        subtotal = getOrderSubtotal().toFixed(2);
        tax = getOrderTax().toFixed(2);
        total = getOrderTotal().toFixed(2);
    }
    return {
        ...steps,
        logoUrl: config.assets.logo || '',
        redLogoUrl: config.assets.redLogo || config.assets.logo || '',
        username,
        displayName: displayName || firstName,
        orderId,
        firstName: (firstName || 'Guest').toUpperCase(),
        orderName: orderName.toUpperCase(),
        robotName: 'FRED',
        estimatedMinutes: 20,
        orderItems,
        subtotal,
        tax,
        total,
        totalItems,
        orderError: bitebotOrder.orderError || '',
        statusPlacedImage: config.assets.statusPlacedImage,
        statusEnRouteImage: config.assets.statusEnRouteImage,
        statusArrivedImage: config.assets.statusArrivedImage,
        statusLogo: config.assets.statusLogo || config.assets.logo,
        campusMapUrl: (config.assets.campusMap || 'images/logo/campus-map.png')
    };
}

function returnFromOrderTracker() {
    goToRestaurantScreen();
}

function getOrderPlacedTemplateData() {
    const username = (typeof userService !== 'undefined' && userService.getUserName()) ? userService.getUserName() : 'Guest';
    const profile = (typeof profileService !== 'undefined' && profileService.lastProfile) ? profileService.lastProfile : {};
    const firstName = (profile.firstName && profile.firstName.trim()) ? profile.firstName.trim() : (username.split(/\s+/)[0] || 'Guest');
    const displayName = (profile.firstName && profile.firstName.trim()) ? profile.firstName.trim() : (username.includes('@') ? (username.split('@')[0].charAt(0).toUpperCase() + username.split('@')[0].slice(1).toLowerCase()) : firstName);
    return {
        logoUrl: config.assets.logo || '',
        redLogoUrl: config.assets.redLogo || config.assets.logo || '',
        displayName: displayName || firstName,
        orderError: bitebotOrder.orderError || ''
    };
}

function goToOrderPlacedScreen() {
    const data = getOrderPlacedTemplateData();
    templateBuilder.build('order-placed-screen', data, 'main');
}

function returnFromOrderPlaced() {
    goToRestaurantScreen();
}

function getOrderDeliveredTemplateData() {
    return {
        logoUrl: config.assets.logo || '',
        redLogoUrl: config.assets.redLogo || config.assets.logo || ''
    };
}

window.goToOrderDeliveredScreen = function() {
    document.body.classList.remove('has-active-order');
    document.body.classList.remove('restaurant-view');
    document.body.classList.remove('on-menu-page');
    
    // Clear the cart
    bitebotOrder.items = [];
    bitebotOrder.orderId = null;
    bitebotOrder.statusScreenEnteredAt = null;
    
    // Update cart display to show 0
    if (typeof updateHeaderCartCount === 'function') {
        updateHeaderCartCount();
    }
    const cartCountEl = document.getElementById('cart-items');
    if (cartCountEl) cartCountEl.textContent = '0';
    
    // Clear server-side cart if available
    if (typeof cartService !== 'undefined' && cartService.clearCart) {
        cartService.clearCart();
    }
    
    const data = getOrderDeliveredTemplateData();
    templateBuilder.build('order-delivered-screen', data, 'main');
};

function updateStatusLogoPosition() {
    const runner = document.querySelector('.order-status-screen .status-logo-runner');
    if (!runner || bitebotOrder.statusScreenEnteredAt == null) return;
    const elapsed = Date.now() - bitebotOrder.statusScreenEnteredAt;
    let pct;
    if (elapsed >= STATUS_TOTAL_MS) {
        pct = 100;
    } else if (elapsed < STATUS_LEG_MS) {
        pct = (elapsed / STATUS_LEG_MS) * 50;
    } else {
        pct = 50 + ((elapsed - STATUS_LEG_MS) / STATUS_LEG_MS) * 50;
    }
    runner.style.left = pct + '%';
    runner.style.transform = 'translateY(-50%) translateX(-50%)';
}

function startStatusLogoUpdater() {
    if (statusLogoUpdaterIntervalId != null) {
        clearInterval(statusLogoUpdaterIntervalId);
        statusLogoUpdaterIntervalId = null;
    }
    if (bitebotOrder.statusScreenEnteredAt == null) {
        bitebotOrder.statusScreenEnteredAt = Date.now();
    }
    updateStatusLogoPosition();
    statusLogoUpdaterIntervalId = setInterval(() => {
        updateStatusLogoPosition();
    }, 500);
}


function goToOrderStatusScreen() {
    document.body.classList.remove('on-menu-page');
    
    if (bitebotOrder.orderId && typeof ordersService !== 'undefined') {
        ordersService.getOrderById(bitebotOrder.orderId)
            .then(response => {
                const order = response.data;
                if (order && order.status) {
                    bitebotOrder.status = order.status;
                    console.log('Fetched latest order status:', order.status);
                }
                const data = getOrderStatusTemplateData();
                templateBuilder.build('order-status-screen', data, 'main', () => {
                    startStatusLogoUpdater();
                    if (typeof campusMap !== 'undefined' && campusMap.startAnimation) {
                        campusMap.startAnimation();
                    }
                });
            })
            .catch(() => {
                const data = getOrderStatusTemplateData();
                templateBuilder.build('order-status-screen', data, 'main', () => {
                    startStatusLogoUpdater();
                    if (typeof campusMap !== 'undefined' && campusMap.startAnimation) {
                        campusMap.startAnimation();
                    }
                });
            });
    } else {
        const data = getOrderStatusTemplateData();
        templateBuilder.build('order-status-screen', data, 'main', () => {
            startStatusLogoUpdater();
            if (typeof campusMap !== 'undefined' && campusMap.startAnimation) {
                campusMap.startAnimation();
            }
        });
    }
}

function pollOrderStatus() {
    if (!bitebotOrder.orderId) return;
    ordersService.getOrderById(bitebotOrder.orderId)
        .then(response => {
            const order = response.data;
            if (order && order.status) {
                const oldStatus = bitebotOrder.status;
                bitebotOrder.status = order.status;
                console.log('Order status polled:', order.status, '(was:', oldStatus + ')');
                
                if (oldStatus !== order.status) {
                    const data = getOrderStatusTemplateData();
                    const main = document.getElementById('main');
                    if (main && main.querySelector('.order-status-screen')) {
                        templateBuilder.build('order-status-screen', data, 'main', () => {
                            startStatusLogoUpdater();
                            if (typeof campusMap !== 'undefined' && campusMap.startAnimation) {
                                campusMap.startAnimation();
                            }
                        });
                    }
                }
            }
        })
        .catch(err => {
            console.log('Status poll error:', err);
        });
}

function startStatusPolling() {
    pollOrderStatus();
    setInterval(pollOrderStatus, STATUS_UPDATE_INTERVAL_MS);
}

if (typeof window !== 'undefined') {
    window.goToLoginScreen = goToLoginScreen;
    window.goToRegisterScreen = goToRegisterScreen;
    window.startOrderOrLogin = startOrderOrLogin;
    window.deliveryOrLogin = deliveryOrLogin;
    window.registerAndGoToRestaurant = registerAndGoToRestaurant;
    window.loginAndGoToRestaurant = loginAndGoToRestaurant;
    window.addToOrder = addToOrder;
    window.setOrderQuantity = setOrderQuantity;
    window.goToRestaurantScreen = goToRestaurantScreen;
    window.goToOrderScreen = goToOrderScreen;
    window.cartOverlayGoToCheckout = cartOverlayGoToCheckout;
    window.goToBitebotCheckoutScreen = goToBitebotCheckoutScreen;
    window.toggleOrderItemsExpand = toggleOrderItemsExpand;
    window.returnToCartFromCheckout = returnToCartFromCheckout;
    window.editDeliveryFromCheckout = editDeliveryFromCheckout;
    window.placeOrderFromCheckoutScreen = placeOrderFromCheckoutScreen;
    window.goToPaymentScreen = goToPaymentScreen;
    window.confirmPaymentAndGoToReview = confirmPaymentAndGoToReview;
    window.placeOrderAndGoToStatus = placeOrderAndGoToStatus;
    window.returnFromOrderTracker = returnFromOrderTracker;
    window.returnFromOrderPlaced = returnFromOrderPlaced;
    window.goToOrderPlacedScreen = goToOrderPlacedScreen;
    window.goToOrderStatusScreen = goToOrderStatusScreen;
}

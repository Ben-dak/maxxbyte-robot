/**
 * BiteBot ordering flow: Home → Login → Restaurant → Order → Payment → Review → Order Status
 */
const TAX_RATE = 0.08;
const STATUS_UPDATE_INTERVAL_MS = 10 * 60 * 1000;   // 10 min between status checks
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
    statusScreenEnteredAt: null
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

function openCartOverlay() {
    const backdrop = document.getElementById('cart-overlay-backdrop');
    const panel = document.getElementById('cart-overlay-panel');
    if (!backdrop || !panel) return;
    renderCartOverlay();
    backdrop.classList.remove('cart-overlay-backdrop--hidden');
    panel.classList.remove('cart-overlay-panel--hidden');
}

function closeCartOverlay() {
    const backdrop = document.getElementById('cart-overlay-backdrop');
    const panel = document.getElementById('cart-overlay-panel');
    if (backdrop) backdrop.classList.add('cart-overlay-backdrop--hidden');
    if (panel) panel.classList.add('cart-overlay-panel--hidden');
}

function renderCartOverlay() {
    const listEl = document.getElementById('cart-overlay-items-list');
    if (!listEl) return;
    listEl.innerHTML = '';
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
    const subtotalEl = document.getElementById('cart-overlay-subtotal');
    const taxEl = document.getElementById('cart-overlay-tax');
    const totalEl = document.getElementById('cart-overlay-total');
    const checkoutBtn = document.getElementById('cart-overlay-checkout-btn');
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
    const loginImg = config.assets.loginFood || config.assets.homeHeroBackground || 'images/logo/homescreen-background.jpg';
    const loginImgPng = config.assets.loginFoodPng || loginImg.replace(/\.jpg$/i, '.png');
    const fallbackImg = config.assets.homeHeroBackground || 'images/logo/homescreen-background.jpg';
    const cacheBust = '?v=' + (Date.now ? Date.now() : 1);
    templateBuilder.build('register-screen', {
        loginLeftImage: loginImg + cacheBust,
        loginLeftImagePng: loginImgPng,
        loginFallbackImage: fallbackImg,
        logoUrl: config.assets.logo
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

function registerAndGoToRestaurant() {
    const username = document.getElementById('register-username')?.value?.trim();
    const password = document.getElementById('register-password')?.value;
    const confirm = document.getElementById('register-confirm')?.value;
    const errEl = document.getElementById('register-error');
    if (!username || !password || !confirm) {
        if (errEl) errEl.textContent = 'Please fill in all fields.';
        return;
    }
    if (password !== confirm) {
        if (errEl) errEl.textContent = 'Password and confirmation do not match.';
        return;
    }
    if (errEl) errEl.textContent = '';
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
                if (typeof productService !== 'undefined' && productService.enableButtons) productService.enableButtons();
                goToRestaurantScreen();
            } else {
                goToRestaurantScreen();
            }
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
            if (errEl) errEl.innerHTML = 'Login failed. <a href="' + config.baseUrl + '/api/seed-user" target="_blank">Create test user</a>';
        });
}

function goToRestaurantScreen() {
    document.body.classList.add('restaurant-view');
    const data = {
        restaurantLogo: config.assets.restaurantLogo,
        tacoImage: config.assets.tacoImage,
        butterChickenImage: config.assets.butterChickenImage
    };
    templateBuilder.build('restaurant-screen', data, 'main');
    const checkoutBar = document.getElementById('saffron-checkout-bar');
    if (checkoutBar && bitebotOrder.items.length > 0) {
        checkoutBar.classList.remove('saffron-checkout-bar--hidden');
    }
}

function goToOrderScreen() {
    document.body.classList.remove('restaurant-view');
    templateBuilder.build('order-screen', {}, 'main');
    setTimeout(renderOrderScreen, 50);
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
            cardNumberDisplay: (p.cardNumberLast4) ? '•••• ' + p.cardNumberLast4 : (p.cardNumber || ''),
            expMonth: p.expMonth || '',
            expYear: (p.expYear && p.expYear.length === 4) ? p.expYear.slice(-2) : (p.expYear || ''),
            billingZip: p.billingZip || p.zip || ''
        } : defaultPayment;
        const addr = p.address || p.billingAddress || '12345 SESAME ST';
        const city = p.city || p.billingCity || 'LALA LAND';
        const state = p.state || p.billingState || 'TX';
        const zip = p.zip || p.billingZip || '90210';
        bitebotOrder.deliveryAddress = { address: addr, city, state, zip };
        return {
            logoUrl: config.assets.logo || '',
            username,
            itemCount,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            deliveryLine1: addr,
            deliveryLine2: city + ', ' + state + ' ' + zip,
            ...paymentData
        };
    };
    const loadThenShow = () => {
        const fromProfile = (typeof profileService !== 'undefined' && profileService.lastProfile) ? profileService.lastProfile : null;
        const fromSession = bitebotOrder.payment;
        const data = getCheckoutData(fromProfile || fromSession);
        templateBuilder.build('bitebot-checkout-screen', data, 'main');
    };
    if (typeof profileService !== 'undefined') {
        profileService.loadProfileForFlow().then(loadThenShow).catch(loadThenShow);
    } else {
        loadThenShow();
    }
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
    const cardNumber = document.getElementById('cardNumber')?.value?.trim() || '';
    const delivery = bitebotOrder.deliveryAddress || {};
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
    goToReviewScreen();
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
    ordersService.createOrder(order)
        .then(response => {
            const data = response.data;
            bitebotOrder.orderId = (data && data.orderId != null) ? data.orderId : (data && data.id != null) ? data.id : null;
            bitebotOrder.status = 'PLACED';
            bitebotOrder.items = [];
            bitebotOrder.statusScreenEnteredAt = Date.now();
            goToOrderStatusScreen();
            if (bitebotOrder.orderId) startStatusPolling();
        })
        .catch(() => {
            const errEl = document.getElementById('errors');
            if (errEl) errEl.innerHTML = '<div class="alert alert-danger">Order could not be placed. Please try again.</div>';
        });
}

function getOrderStatusTemplateData() {
    const status = bitebotOrder.status || 'PLACED';
    const steps = { step1Class: '', step2Class: '', step3Class: '', connector1Class: '', connector2Class: '' };
    if (status === 'PLACED') {
        steps.step1Class = 'active';
        steps.connector1Class = 'pending';
        steps.connector2Class = 'pending';
    } else if (status === 'EN_ROUTE' || status === 'IN_TRANSIT') {
        steps.step1Class = 'done';
        steps.step2Class = 'active';
        steps.connector1Class = 'done';
        steps.connector2Class = 'pending';
    } else {
        steps.step1Class = 'done';
        steps.step2Class = 'done';
        steps.step3Class = 'active';
        steps.connector1Class = 'done';
        steps.connector2Class = 'done';
    }
    return {
        ...steps,
        statusPlacedImage: config.assets.statusPlacedImage,
        statusEnRouteImage: config.assets.statusEnRouteImage,
        statusArrivedImage: config.assets.statusArrivedImage,
        statusLogo: config.assets.statusLogo || config.assets.logo
    };
}

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
    statusLogoUpdaterIntervalId = setInterval(updateStatusLogoPosition, 500);
}

function goToOrderStatusScreen() {
    const data = getOrderStatusTemplateData();
    templateBuilder.build('order-status-screen', data, 'main', startStatusLogoUpdater);
}

function startStatusPolling() {
    setInterval(() => {
        if (!bitebotOrder.orderId) return;
        ordersService.getOrderById(bitebotOrder.orderId)
            .then(response => {
                const order = response.data;
                if (order && order.status) {
                    bitebotOrder.status = order.status;
                    const data = getOrderStatusTemplateData();
                    const main = document.getElementById('main');
                    if (main && main.querySelector('.order-status-screen')) {
                        templateBuilder.build('order-status-screen', data, 'main', startStatusLogoUpdater);
                    }
                }
            })
            .catch(() => {});
    }, STATUS_UPDATE_INTERVAL_MS);
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
    window.openCartOverlay = openCartOverlay;
    window.closeCartOverlay = closeCartOverlay;
    window.cartOverlayGoToCheckout = cartOverlayGoToCheckout;
    window.goToBitebotCheckoutScreen = goToBitebotCheckoutScreen;
    window.returnToCartFromCheckout = returnToCartFromCheckout;
    window.editDeliveryFromCheckout = editDeliveryFromCheckout;
    window.placeOrderFromCheckoutScreen = placeOrderFromCheckoutScreen;
    window.goToPaymentScreen = goToPaymentScreen;
    window.confirmPaymentAndGoToReview = confirmPaymentAndGoToReview;
    window.placeOrderAndGoToStatus = placeOrderAndGoToStatus;
}

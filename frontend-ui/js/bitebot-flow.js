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
    goToOrderScreen();
}

function setOrderQuantity(mealId, delta) {
    const item = bitebotOrder.items.find(i => i.id === mealId);
    if (!item) return;
    item.quantity = Math.max(0, item.quantity + delta);
    if (item.quantity === 0) {
        bitebotOrder.items = bitebotOrder.items.filter(i => i.id !== mealId);
    }
    renderOrderScreen();
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

function goToLoginScreen() {
    templateBuilder.build('login-screen', {}, 'main');
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
}

function goToOrderScreen() {
    document.body.classList.remove('restaurant-view');
    templateBuilder.build('order-screen', {}, 'main');
    setTimeout(renderOrderScreen, 50);
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
    window.loginAndGoToRestaurant = loginAndGoToRestaurant;
    window.addToOrder = addToOrder;
    window.setOrderQuantity = setOrderQuantity;
    window.goToRestaurantScreen = goToRestaurantScreen;
    window.goToOrderScreen = goToOrderScreen;
    window.goToPaymentScreen = goToPaymentScreen;
    window.confirmPaymentAndGoToReview = confirmPaymentAndGoToReview;
    window.placeOrderAndGoToStatus = placeOrderAndGoToStatus;
}

/**
 * Campus map: route data and robot animation on the order tracker.
 * Routes are arrays of [percentY, percentX] over the map image (0–100).
 * Matches layout: Pizza Palace (Lake/Maple), Burger House, Sushi World (Maple Ave),
 * Saffron & Serrano (Oak St); deliveries: Campus North, Campus South, Downtown Hub, Tech Park.
 */
const campusMap = (function () {
    // TEST_MODE: true = 10 sec each phase (testing); false = 10 min each (production). Change to false when ready.
    const TEST_MODE = false;
    const RESTAURANT_WAIT_MS = TEST_MODE ? 10 * 1000 : 10 * 60 * 1000;   // 10 sec or 10 min prep
    const ROUTE_DURATION_MS = TEST_MODE ? 10 * 1000 : 10 * 60 * 1000;   // 10 sec or 10 min transit

    // Delivery endpoints [percentY, percentX] - positioned ON buildings, not on street
    const DELIVERY_ENDPOINTS = {
        'campus-north': [14, 52],   // 100 University Ave - on building (top center-right)
        'campus-south': [58, 82],   // 200 College Blvd - right side
        'downtown': [58, 38],       // 50 Main Street - Main St & Oak St
        'tech-park': [75, 85]       // 300 Innovation Dr - bottom-right
    };

    // Restaurant start positions [percentY, percentX] - aligned with building locations
    const RESTAURANT_STARTS = {
        1: [15, 15],   // Pizza Palace - top-left near Lake/Maple Ave
        2: [35, 15],   // Burger House - left side Maple Ave
        3: [50, 15],   // Sushi World - left side Maple Ave, south of Burger
        4: [86, 18]    // Saffron & Serrano - bottom-left Oak St/Maple intersection
    };

    // Routes: strict street/sidewalk paths only. NO grass. Maple Ave (X~17), University Ave (Y~16), Main St, Oak St, College Blvd, Innovation Dr.
    const RESTAURANT_ROUTES = {
        1: { // Pizza Palace - Maple Ave -> University Ave (N) or Main St (S) - no grass
            'campus-north': [[15, 17], [15, 22], [15, 28], [15, 35], [15, 42], [15, 50], [14, 52]],
            'campus-south': [[15, 17], [28, 17], [42, 17], [54, 18], [58, 28], [58, 48], [58, 65], [58, 82]],
            'downtown': [[15, 17], [28, 17], [42, 18], [50, 26], [55, 32], [58, 38]],
            'tech-park': [[15, 17], [30, 17], [48, 17], [58, 22], [62, 35], [68, 52], [72, 70], [75, 82], [75, 85]]
        },
        2: { // Burger House - north on Maple Ave -> University Ave (N) or south to Main St
            'campus-north': [[35, 17], [28, 17], [22, 17], [16, 17], [16, 25], [16, 35], [16, 45], [14, 52]],
            'campus-south': [[35, 17], [45, 17], [52, 18], [56, 25], [58, 45], [58, 65], [58, 82]],
            'downtown': [[35, 17], [42, 17], [50, 24], [54, 32], [58, 38]],
            'tech-park': [[35, 17], [48, 17], [55, 25], [62, 48], [70, 70], [75, 85]]
        },
        3: { // Sushi World - north on Maple Ave -> University Ave (N) or cross to Main St
            'campus-north': [[50, 17], [42, 17], [35, 17], [25, 17], [16, 17], [16, 28], [16, 40], [14, 52]],
            'campus-south': [[50, 17], [52, 25], [54, 42], [56, 58], [58, 72], [58, 82]],
            'downtown': [[50, 17], [52, 24], [54, 30], [56, 35], [58, 38]],
            'tech-park': [[50, 17], [52, 32], [58, 52], [68, 70], [74, 80], [75, 85]]
        },
        4: { // Saffron & Serrano - Oak St/Main St (no grass). N on Oak/Maple, E on University for Campus North.
            'campus-north': [[86, 18], [82, 18], [75, 18], [65, 18], [55, 18], [45, 18], [35, 18], [25, 18], [16, 18], [16, 28], [16, 40], [16, 50], [14, 52]],
            'campus-south': [[86, 18], [84, 22], [80, 30], [75, 40], [70, 52], [65, 65], [62, 75], [58, 82]],
            'downtown': [[86, 18], [84, 22], [80, 26], [75, 30], [70, 33], [65, 35], [62, 36], [58, 38]],
            'tech-park': [[86, 18], [84, 25], [82, 40], [80, 55], [78, 68], [76, 78], [75, 85]]
        }
    };

    function getDeliveryKeyFromOrder() {
        let addr = '';
        if (typeof bitebotOrder !== 'undefined' && bitebotOrder.deliveryAddress) {
            const d = bitebotOrder.deliveryAddress;
            addr = (typeof d === 'object' && d.address) ? d.address : (typeof d === 'string' ? d : '');
        }
        if (typeof getLocationKeyFromAddress === 'function') {
            const key = getLocationKeyFromAddress(addr);
            if (key && DELIVERY_ENDPOINTS[key]) return key;
        }
        return 'campus-north';
    }

    function getRouteForOrder(restaurantId, deliveryKey) {
        const delivery = deliveryKey || getDeliveryKeyFromOrder();
        const rest = RESTAURANT_ROUTES[restaurantId];
        if (!rest) return null;
        return rest[delivery] || rest['campus-north'];
    }

    // Fallback route (Saffron & Serrano -> Campus North)
    const DEMO_ROUTE = getRouteForOrder(4, 'campus-north');

    let animationId = null;
    let isBlocked = false;
    let blockedAt = null;

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function formatTime(ms) {
        if (ms <= 0) return '0:00';
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    function updateEtaTimer(phase, remainingMs) {
        const etaContainer = document.getElementById('order-tracker-eta');
        const etaCountdown = document.getElementById('eta-countdown');
        if (!etaContainer || !etaCountdown) return;

        // Remove all phase classes first
        etaContainer.classList.remove('phase-prep', 'phase-transit');

        if (phase === 'PLACED' && remainingMs > 0) {
            // Prep phase: "Your order is being prepared!"
            etaContainer.classList.add('visible', 'phase-prep');
            etaCountdown.textContent = formatTime(remainingMs);
        } else if (phase === 'IN_TRANSIT' && remainingMs > 0) {
            // Transit phase: "Your order is on it's way!"
            etaContainer.classList.add('visible', 'phase-transit');
            etaCountdown.textContent = formatTime(remainingMs);
        } else {
            etaContainer.classList.remove('visible');
            etaCountdown.textContent = '--:--';
        }
    }

    function setBlocked(blocked, blockedTime) {
        isBlocked = blocked;
        blockedAt = blockedTime || null;
        
        const robot = document.querySelector('.order-tracker-map-robot');
        const blockedIndicator = document.querySelector('.order-tracker-blocked-indicator');
        
        if (blocked) {
            if (robot) robot.classList.add('robot-blocked');
            if (blockedIndicator) blockedIndicator.classList.add('visible');
            updateStatusBar('BLOCKED');
            updateEtaTimer('BLOCKED', 0);
        } else {
            if (robot) robot.classList.remove('robot-blocked');
            if (blockedIndicator) blockedIndicator.classList.remove('visible');
        }
    }

    function updateStatusBar(phase) {
        const steps = document.querySelectorAll('.order-tracker-step');
        if (steps.length < 3) return;
        
        // Remove all state classes
        steps.forEach(step => {
            step.classList.remove('active', 'done', 'pending', 'blocked');
        });

        // Remove blocked class from container
        const statusBar = document.querySelector('.order-tracker-status-bar');
        if (statusBar) {
            statusBar.classList.remove('status-blocked');
        }
        
        if (phase === 'PLACED') {
            steps[0].classList.add('active');
        } else if (phase === 'IN_TRANSIT') {
            steps[0].classList.add('done');
            steps[1].classList.add('active');
        } else if (phase === 'BLOCKED') {
            steps[0].classList.add('done');
            steps[1].classList.add('active', 'blocked');
            if (statusBar) statusBar.classList.add('status-blocked');
        } else if (phase === 'DELIVERED') {
            steps[0].classList.add('done');
            steps[1].classList.add('done');
            steps[2].classList.add('active');
        }
    }

    function positionRobot(robot, route, elapsed) {
        let phase = 'PLACED';
        
        if (elapsed < RESTAURANT_WAIT_MS) {
            robot.style.top = route[0][0] + '%';
            robot.style.left = route[0][1] + '%';
            robot.style.transform = 'translate(-50%, -50%)';
            phase = 'PLACED';
            const prepRemainingMs = RESTAURANT_WAIT_MS - elapsed;
            updateStatusBar(phase);
            updateEtaTimer(phase, prepRemainingMs);
            return false; // not finished
        }

        const pathElapsed = elapsed - RESTAURANT_WAIT_MS;
        const progress = Math.min(pathElapsed / ROUTE_DURATION_MS, 1);
        const remainingMs = ROUTE_DURATION_MS - pathElapsed;

        const pathLength = route.length - 1;
        const pathProgress = progress * pathLength;
        const segIdx = Math.min(Math.floor(pathProgress), pathLength - 1);
        const segT = pathProgress - segIdx;

        const p0 = route[segIdx];
        const p1 = route[segIdx + 1];
        const percentY = lerp(p0[0], p1[0], segT);
        const percentX = lerp(p0[1], p1[1], segT);

        robot.style.top = percentY + '%';
        robot.style.left = percentX + '%';
        robot.style.transform = 'translate(-50%, -50%)';
        
        if (progress >= 1) {
            phase = 'DELIVERED';
            updateStatusBar(phase);
            updateEtaTimer(phase, 0);
            return true; // finished
        } else {
            phase = 'IN_TRANSIT';
            updateStatusBar(phase);
            updateEtaTimer(phase, remainingMs);
            return false; // not finished
        }
    }

let deliveredScreenShown = false;

    function showDeliveredScreen() {
        if (deliveredScreenShown) return;
        
        // Don't show delivered screen if order was cancelled
        if (typeof bitebotOrder !== 'undefined') {
            if (bitebotOrder.status === 'CANCELLED' || !bitebotOrder.orderId) {
                return;
            }
        }
        
        deliveredScreenShown = true;

        // Short delay to let user see the completed status bar
        setTimeout(() => {
            // Double-check order wasn't cancelled during the delay
            if (typeof bitebotOrder !== 'undefined' && 
                (bitebotOrder.status === 'CANCELLED' || !bitebotOrder.orderId)) {
                return;
            }
            if (typeof goToOrderDeliveredScreen === 'function') {
                goToOrderDeliveredScreen();
            }
        }, 1500);
    }
    
    function resetDeliveredFlag() {
        deliveredScreenShown = false;
    }

    function runAnimation(robot, route, orderStartTime) {
        if (animationId != null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        function tick() {
            // If blocked, pause animation but keep checking
            if (isBlocked) {
                updateStatusBar('BLOCKED');
                animationId = requestAnimationFrame(tick);
                return;
            }
            
            const elapsed = Date.now() - orderStartTime;
            const finished = positionRobot(robot, route, elapsed);
            
            if (!finished) {
                animationId = requestAnimationFrame(tick);
            } else {
                showDeliveredScreen();
            }
        }

        // Position immediately based on elapsed time (unless blocked)
        if (!isBlocked) {
            const elapsed = Date.now() - orderStartTime;
            const alreadyFinished = positionRobot(robot, route, elapsed);
            
            if (!alreadyFinished) {
                animationId = requestAnimationFrame(tick);
            } else {
                showDeliveredScreen();
            }
        } else {
            updateStatusBar('BLOCKED');
            animationId = requestAnimationFrame(tick);
        }
    }

    function startAnimation() {
        const screen = document.querySelector('.order-status-screen');
        if (!screen) return;
        const frame = screen.querySelector('.order-tracker-map-frame');
        const robot = screen.querySelector('.order-tracker-map-robot');
        if (!frame || !robot) return;

        // Use order.createdAt from backend when available (syncs UI with backend transitions)
        let orderStartTime = Date.now();
        if (typeof bitebotOrder !== 'undefined') {
            if (bitebotOrder.orderCreatedAt) {
                orderStartTime = bitebotOrder.orderCreatedAt;
            } else if (bitebotOrder.statusScreenEnteredAt) {
                orderStartTime = bitebotOrder.statusScreenEnteredAt;
            }
        }

        // Immediately update status bar and ETA based on elapsed time (fixes visual sync issue)
        const elapsed = Date.now() - orderStartTime;
        if (isBlocked) {
            updateStatusBar('BLOCKED');
            updateEtaTimer('BLOCKED', 0);
        } else if (elapsed < RESTAURANT_WAIT_MS) {
            const prepRemainingMs = RESTAURANT_WAIT_MS - elapsed;
            updateStatusBar('PLACED');
            updateEtaTimer('PLACED', prepRemainingMs);
        } else {
            const pathElapsed = elapsed - RESTAURANT_WAIT_MS;
            const progress = Math.min(pathElapsed / ROUTE_DURATION_MS, 1);
            const remainingMs = ROUTE_DURATION_MS - pathElapsed;
            if (progress >= 1) {
                updateStatusBar('DELIVERED');
                updateEtaTimer('DELIVERED', 0);
            } else {
                updateStatusBar('IN_TRANSIT');
                updateEtaTimer('IN_TRANSIT', remainingMs);
            }
        }

        // Get route based on selected restaurant and delivery address
        let restaurantId = 4; // default
        if (typeof currentRestaurantId !== 'undefined') {
            restaurantId = currentRestaurantId;
        } else if (typeof bitebotOrder !== 'undefined' && bitebotOrder.restaurantId) {
            restaurantId = bitebotOrder.restaurantId;
        }
        const route = getRouteForOrder(restaurantId) || DEMO_ROUTE;

        const img = frame.querySelector('.order-tracker-map-image');
        if (img && img.complete) {
            runAnimation(robot, route, orderStartTime);
        } else if (img) {
            img.addEventListener('load', function onLoad() {
                img.removeEventListener('load', onLoad);
                runAnimation(robot, route, orderStartTime);
            });
        } else {
            runAnimation(robot, route, orderStartTime);
        }
    }

    return {
        startAnimation: startAnimation,
        resetDelivered: resetDeliveredFlag,
        setBlocked: setBlocked,
        isBlocked: function() { return isBlocked; },
        getDemoRoute: function () { return DEMO_ROUTE.slice(); }
    };
})();

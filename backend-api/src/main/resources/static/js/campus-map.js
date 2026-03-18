/**
 * Campus map: route data and robot animation on the order tracker.
 * Routes are arrays of [percentY, percentX] over the map image (0–100).
 * Fetches from GET /map/campus-data when available; falls back to hardcoded values.
 */
const campusMap = (function () {
    // TEST_MODE: true = 10 sec each phase (testing); false = 10 min each (production). Change to false when ready.
    const TEST_MODE = false;
    const RESTAURANT_WAIT_MS = TEST_MODE ? 10 * 1000 : 10 * 60 * 1000;   // 10 sec or 10 min prep
    const ROUTE_DURATION_MS = TEST_MODE ? 10 * 1000 : 10 * 60 * 1000;   // 10 sec or 10 min transit

    // Fallback data when API is unavailable
    const FALLBACK_DELIVERY_ENDPOINTS = {
        'campus-north': [14, 52], 'campus-south': [58, 82], 'downtown': [62, 38], 'tech-park': [78, 88]
    };
    const FALLBACK_RESTAURANT_STARTS = {
        1: [12, 18], 2: [32, 18], 3: [48, 18], 4: [82, 22]
    };
    const FALLBACK_RESTAURANT_ROUTES = {
        1: { // Pizza Palace - south on Maple to intersection, east on University Ave, north into Campus North
            'campus-north': [[12, 18], [14, 18], [16, 18], [18, 18], [18, 25], [18, 35], [18, 45], [18, 52], [16, 52], [14, 52]],
            'campus-south': [[12, 18], [22, 18], [35, 18], [48, 18], [54, 25], [56, 45], [58, 65], [58, 82]],
            'downtown': [[12, 18], [25, 18], [42, 18], [52, 22], [58, 32], [62, 38]],
            'tech-park': [[12, 18], [25, 18], [42, 18], [55, 25], [65, 45], [72, 68], [78, 82], [78, 88]]
        },
        2: { // Burger House - north on Maple (N); south on Maple to intersection for S/D/T
            'campus-north': [[32, 18], [26, 18], [20, 18], [16, 18], [16, 28], [16, 40], [14, 52]],
            'campus-south': [[32, 18], [42, 18], [52, 18], [56, 28], [58, 50], [58, 72], [58, 82]],
            'downtown': [[32, 18], [42, 18], [52, 18], [58, 28], [62, 36], [62, 38]],
            'tech-park': [[32, 18], [42, 18], [52, 18], [58, 30], [65, 50], [72, 72], [78, 85], [78, 88]]
        },
        3: { // Sushi World - north on Maple (N); south on Maple, College Blvd (S/T) or Oak->Main (D)
            'campus-north': [[48, 18], [40, 18], [30, 18], [20, 18], [16, 18], [16, 30], [16, 42], [14, 52]],
            'campus-south': [[48, 18], [52, 22], [54, 35], [56, 52], [58, 70], [58, 82]],
            'downtown': [[48, 18], [54, 18], [60, 20], [64, 28], [62, 36], [62, 38]],
            'tech-park': [[48, 18], [52, 22], [54, 38], [58, 55], [68, 72], [76, 84], [78, 88]]
        },
        4: { // Saffron & Serrano - Oak St east to Maple, north on Maple; Main St east for S/D/T
            'campus-north': [[82, 22], [78, 20], [70, 18], [58, 18], [45, 18], [30, 18], [18, 18], [16, 28], [16, 42], [14, 52]],
            'campus-south': [[82, 22], [78, 20], [72, 22], [68, 30], [65, 48], [62, 68], [58, 82]],
            'downtown': [[82, 22], [78, 20], [72, 22], [68, 28], [65, 34], [62, 38]],
            'tech-park': [[82, 22], [78, 20], [72, 24], [68, 38], [70, 55], [74, 72], [78, 85], [78, 88]]
        }
    };

    // Live data from API; overwritten when /map/campus-data succeeds
    let deliveryEndpoints = Object.assign({}, FALLBACK_DELIVERY_ENDPOINTS);
    let restaurantStarts = Object.assign({}, FALLBACK_RESTAURANT_STARTS);
    let restaurantRoutes = JSON.parse(JSON.stringify(FALLBACK_RESTAURANT_ROUTES));

    function loadCampusData() {
        const base = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
        fetch(base + '/map/campus-data')
            .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status))
            .then(data => {
                if (data.deliveryEndpoints && Object.keys(data.deliveryEndpoints).length > 0) {
                    deliveryEndpoints = data.deliveryEndpoints;
                }
                if (data.restaurantStarts && Object.keys(data.restaurantStarts).length > 0) {
                    restaurantStarts = data.restaurantStarts;
                }
                if (data.routes && Object.keys(data.routes).length > 0) {
                    restaurantRoutes = data.routes;
                }
            })
            .catch(() => { /* keep fallbacks */ });
    }
    loadCampusData();

    function getDeliveryKeyFromOrder() {
        let addr = '';
        if (typeof bitebotOrder !== 'undefined' && bitebotOrder.deliveryAddress) {
            const d = bitebotOrder.deliveryAddress;
            addr = (typeof d === 'object' && d.address) ? d.address : (typeof d === 'string' ? d : '');
        }
        if (typeof getLocationKeyFromAddress === 'function') {
            const key = getLocationKeyFromAddress(addr);
            if (key && deliveryEndpoints[key]) return key;
        }
        return 'campus-north';
    }

    function getRouteForOrder(restaurantId, deliveryKey) {
        const delivery = deliveryKey || getDeliveryKeyFromOrder();
        const rest = restaurantRoutes[restaurantId] || restaurantRoutes[String(restaurantId)];
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

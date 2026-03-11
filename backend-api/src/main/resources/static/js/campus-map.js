/**
 * Campus map: route data and robot animation on the order tracker.
 * Routes are arrays of [percentY, percentX] over the map image (0–100).
 */
const campusMap = (function () {
    const RESTAURANT_WAIT_MS = 10 * 60 * 1000;  // 10 min at restaurant before leaving
    const ROUTE_DURATION_MS = 10 * 60 * 1000;   // 10 min to reach destination

    // Demo route: points as [percentFromTop, percentFromLeft] (approximate path on campus map)
    const DEMO_ROUTE = [
        [38, 22],  // start near restaurant area (left)
        [42, 32],
        [48, 42],
        [52, 52],
        [55, 62],
        [58, 72],
        [62, 82]   // end near dorm area (right)
    ];

    let animationId = null;

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function updateStatusBar(phase) {
        const steps = document.querySelectorAll('.order-tracker-step');
        if (steps.length < 3) return;
        
        // Remove all state classes
        steps.forEach(step => {
            step.classList.remove('active', 'done', 'pending');
        });
        
        if (phase === 'PLACED') {
            // Only first step highlighted
            steps[0].classList.add('active');
        } else if (phase === 'IN_TRANSIT') {
            // First two steps highlighted
            steps[0].classList.add('active');
            steps[1].classList.add('active');
        } else if (phase === 'DELIVERED') {
            // All three steps highlighted
            steps[0].classList.add('active');
            steps[1].classList.add('active');
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
            updateStatusBar(phase);
            return false; // not finished
        }

        const pathElapsed = elapsed - RESTAURANT_WAIT_MS;
        const progress = Math.min(pathElapsed / ROUTE_DURATION_MS, 1);

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
            return true; // finished
        } else {
            phase = 'IN_TRANSIT';
            updateStatusBar(phase);
            return false; // not finished
        }
    }

    let deliveredScreenShown = false;
    
    function showDeliveredScreen() {
        if (deliveredScreenShown) return;
        deliveredScreenShown = true;
        
        // Short delay to let user see the completed status bar
        setTimeout(() => {
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
            const elapsed = Date.now() - orderStartTime;
            const finished = positionRobot(robot, route, elapsed);
            
            if (!finished) {
                animationId = requestAnimationFrame(tick);
            } else {
                showDeliveredScreen();
            }
        }

        // Position immediately based on elapsed time
        const elapsed = Date.now() - orderStartTime;
        const alreadyFinished = positionRobot(robot, route, elapsed);
        
        // Continue animating if not finished, or show delivered screen if already done
        if (!alreadyFinished) {
            animationId = requestAnimationFrame(tick);
        } else {
            showDeliveredScreen();
        }
    }

    function startAnimation() {
        const screen = document.querySelector('.order-status-screen');
        if (!screen) return;
        const frame = screen.querySelector('.order-tracker-map-frame');
        const robot = screen.querySelector('.order-tracker-map-robot');
        if (!frame || !robot) return;

        // Get the order start time from bitebotOrder
        let orderStartTime = Date.now();
        if (typeof bitebotOrder !== 'undefined' && bitebotOrder.statusScreenEnteredAt) {
            orderStartTime = bitebotOrder.statusScreenEnteredAt;
        }

        const route = DEMO_ROUTE;

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
        getDemoRoute: function () { return DEMO_ROUTE.slice(); }
    };
})();

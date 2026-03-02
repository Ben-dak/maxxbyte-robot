/**
 * Campus map: route data and robot animation on the order tracker.
 * Routes are arrays of [percentY, percentX] over the map image (0–100).
 */
const campusMap = (function () {
    const RESTAURANT_WAIT_MS = 10 * 60 * 1000;  // 10 min at restaurant before leaving
    const ROUTE_DURATION_MS = 10 * 60 * 1000;  // 10 min to reach destination

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

    function runAnimation(robot, route) {
        if (animationId != null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        const startTime = Date.now();

        function tick() {
            const elapsed = Date.now() - startTime;

            if (elapsed < RESTAURANT_WAIT_MS) {
                robot.style.top = route[0][0] + '%';
                robot.style.left = route[0][1] + '%';
                robot.style.transform = 'translate(-50%, -50%)';
                animationId = requestAnimationFrame(tick);
                return;
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

            if (progress < 1) {
                animationId = requestAnimationFrame(tick);
            }
        }

        robot.style.top = route[0][0] + '%';
        robot.style.left = route[0][1] + '%';
        robot.style.transform = 'translate(-50%, -50%)';
        animationId = requestAnimationFrame(tick);
    }

    function startAnimation() {
        const screen = document.querySelector('.order-status-screen');
        if (!screen) return;
        const frame = screen.querySelector('.order-tracker-map-frame');
        const robot = screen.querySelector('.order-tracker-map-robot');
        if (!frame || !robot) return;

        const route = DEMO_ROUTE;
        robot.style.top = route[0][0] + '%';
        robot.style.left = route[0][1] + '%';
        robot.style.transform = 'translate(-50%, -50%)';

        const img = frame.querySelector('.order-tracker-map-image');
        if (img && img.complete) {
            runAnimation(robot, route);
        } else if (img) {
            img.addEventListener('load', function onLoad() {
                img.removeEventListener('load', onLoad);
                runAnimation(robot, route);
            });
        } else {
            runAnimation(robot, route);
        }
    }

    return {
        startAnimation: startAnimation,
        getDemoRoute: function () { return DEMO_ROUTE.slice(); }
    };
})();

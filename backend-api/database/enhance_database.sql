-- ============================================================
-- MAXXBYTE ROBOT - DATABASE ENHANCEMENTS
-- Compatible with your actual database schema
-- ============================================================

USE maxxbyte_robot;

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- ============================================================
-- 1. ADD CATEGORIES (Restaurants)
-- ============================================================

-- Clear and repopulate categories
DELETE FROM categories WHERE 1=1;

INSERT INTO categories (category_id, name) VALUES
(1, 'Pizza Palace'),
(2, 'Burger House'),
(3, 'Sushi World'),
(4, 'Saffron & Serrano');

-- ============================================================
-- 2. ADD PRODUCTS (Menu Items)
-- ============================================================

-- Clear existing products to avoid duplicates
DELETE FROM products WHERE 1=1;

-- Pizza Palace (category_id = 1)
INSERT INTO products (name, description, price, image_url, category_id) VALUES
('Pepperoni Pizza', 'Classic pepperoni with mozzarella cheese', 14.99, 'pepperoni.jpg', 1),
('Margherita Pizza', 'Fresh basil, tomatoes, and mozzarella', 12.99, 'margherita.jpg', 1),
('BBQ Chicken Pizza', 'Grilled chicken with tangy BBQ sauce', 15.99, 'bbq-chicken-pizza.jpg', 1),
('Garlic Breadsticks', 'Warm breadsticks with garlic butter', 5.99, 'garlic-bread.jpg', 1),
('Caesar Salad', 'Crisp romaine with parmesan and croutons', 8.99, 'caesar-salad.jpg', 1);

-- Burger House (category_id = 2)
INSERT INTO products (name, description, price, image_url, category_id) VALUES
('Classic Cheeseburger', 'Angus beef with cheddar and pickles', 11.99, 'cheeseburger.jpg', 2),
('Bacon BBQ Burger', 'Smoky bacon with BBQ sauce and onion rings', 13.99, 'bbq-burger.jpg', 2),
('Mushroom Swiss Burger', 'Sautéed mushrooms with Swiss cheese', 12.99, 'mushroom-burger.jpg', 2),
('Crispy Fries', 'Golden crispy seasoned fries', 4.99, 'fries.jpg', 2),
('Onion Rings', 'Beer-battered crispy onion rings', 5.99, 'onion-rings.jpg', 2),
('Chocolate Milkshake', 'Thick and creamy chocolate shake', 6.99, 'milkshake.jpg', 2);

-- Sushi World (category_id = 3)
INSERT INTO products (name, description, price, image_url, category_id) VALUES
('California Roll', 'Crab, avocado, and cucumber (8 pcs)', 9.99, 'california-roll.jpg', 3),
('Salmon Sashimi', 'Fresh Atlantic salmon slices (6 pcs)', 15.99, 'salmon-sashimi.jpg', 3),
('Dragon Roll', 'Eel and cucumber topped with avocado (8 pcs)', 16.99, 'dragon-roll.jpg', 3),
('Spicy Tuna Roll', 'Fresh tuna with spicy mayo (8 pcs)', 12.99, 'spicy-tuna.jpg', 3),
('Miso Soup', 'Traditional Japanese soybean soup', 3.99, 'miso-soup.jpg', 3),
('Edamame', 'Steamed soybeans with sea salt', 4.99, 'edamame.jpg', 3);

-- Saffron & Serrano (category_id = 4)
INSERT INTO products (name, description, price, image_url, category_id) VALUES
('Taco Combo', 'Three ribeye steak tacos with basmati rice', 15.00, 'taco.jpg', 4),
('Butter Chicken', 'Tender chicken in creamy tomato sauce', 15.00, 'butter-chicken.jpg', 4),
('Chicken Tikka Masala', 'Grilled chicken in spiced curry sauce', 14.99, 'tikka-masala.jpg', 4),
('Loaded Nachos', 'Crispy tortillas with cheese and guacamole', 11.99, 'nachos.jpg', 4),
('Mango Lassi', 'Sweet mango yogurt drink', 4.99, 'mango-lassi.jpg', 4),
('Churros', 'Cinnamon sugar churros with chocolate sauce', 6.99, 'churros.jpg', 4);

-- ============================================================
-- 3. DELIVERY METRICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_metrics (
    metric_id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    total_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    failed_orders INT DEFAULT 0,
    avg_delivery_time_minutes DECIMAL(5,2) DEFAULT 0,
    on_time_deliveries INT DEFAULT 0,
    late_deliveries INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- Insert sample historical metrics data
INSERT IGNORE INTO delivery_metrics (date, total_orders, completed_orders, failed_orders, avg_delivery_time_minutes, on_time_deliveries, late_deliveries, total_revenue) VALUES
('2026-03-01', 45, 43, 2, 17.5, 40, 3, 675.50),
('2026-03-02', 52, 51, 1, 16.8, 48, 3, 780.25),
('2026-03-03', 38, 38, 0, 15.2, 38, 0, 570.00),
('2026-03-04', 61, 58, 3, 18.1, 52, 6, 915.75),
('2026-03-05', 55, 54, 1, 16.5, 51, 3, 825.00),
('2026-03-06', 48, 47, 1, 17.0, 44, 3, 720.50),
('2026-03-07', 67, 65, 2, 17.8, 58, 7, 1005.00),
('2026-03-08', 72, 70, 2, 16.2, 67, 3, 1080.25),
('2026-03-09', 58, 57, 1, 15.9, 55, 2, 870.00),
('2026-03-10', 63, 62, 1, 16.4, 59, 3, 945.50),
('2026-03-11', 49, 48, 1, 17.2, 45, 3, 735.25),
('2026-03-12', 54, 53, 1, 16.7, 50, 3, 810.00);

-- ============================================================
-- 4. ROBOT BATTERY HISTORY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS robot_battery_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    robot_id INT NOT NULL,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    battery_level INT NOT NULL,
    status VARCHAR(50),
    event_type ENUM('STATUS_CHECK', 'DELIVERY_START', 'DELIVERY_END', 'CHARGING_START', 'CHARGING_END', 'LOW_BATTERY_ALERT') DEFAULT 'STATUS_CHECK',
    notes VARCHAR(255),
    FOREIGN KEY (robot_id) REFERENCES robots(robot_id)
);

-- Insert sample battery history for Robot 1
INSERT INTO robot_battery_logs (robot_id, logged_at, battery_level, status, event_type, notes) VALUES
(1, '2026-03-11 08:00:00', 100, 'Active', 'CHARGING_END', 'Full charge complete'),
(1, '2026-03-11 09:15:00', 92, 'Delivering', 'DELIVERY_START', 'Order #12 - Pizza Palace'),
(1, '2026-03-11 09:35:00', 88, 'Active', 'DELIVERY_END', 'Order #12 delivered'),
(1, '2026-03-11 10:45:00', 85, 'Delivering', 'DELIVERY_START', 'Order #14 - Sushi World'),
(1, '2026-03-11 11:05:00', 80, 'Active', 'DELIVERY_END', 'Order #14 delivered'),
(1, '2026-03-11 12:30:00', 75, 'Delivering', 'DELIVERY_START', 'Order #16 - Burger House'),
(1, '2026-03-11 12:50:00', 70, 'Active', 'DELIVERY_END', 'Order #16 delivered'),
(1, '2026-03-11 14:00:00', 65, 'Delivering', 'DELIVERY_START', 'Order #18 - Saffron & Serrano'),
(1, '2026-03-11 14:20:00', 60, 'Active', 'DELIVERY_END', 'Order #18 delivered'),
(1, '2026-03-11 16:00:00', 55, 'Active', 'STATUS_CHECK', 'Routine check'),
(1, '2026-03-11 18:00:00', 45, 'Active', 'STATUS_CHECK', 'End of shift check'),
(1, '2026-03-12 07:00:00', 40, 'Charging', 'CHARGING_START', 'Overnight charge started'),
(1, '2026-03-12 08:30:00', 85, 'Active', 'CHARGING_END', 'Ready for deliveries');

-- ============================================================
-- 5. CHARGING SESSIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS charging_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    robot_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    start_battery INT NOT NULL,
    end_battery INT,
    duration_minutes INT,
    energy_consumed_kwh DECIMAL(6,3),
    charging_station VARCHAR(50),
    FOREIGN KEY (robot_id) REFERENCES robots(robot_id)
);

-- Insert sample charging sessions
INSERT INTO charging_sessions (robot_id, start_time, end_time, start_battery, end_battery, duration_minutes, energy_consumed_kwh, charging_station) VALUES
(1, '2026-03-10 22:00:00', '2026-03-11 06:00:00', 35, 100, 480, 2.450, 'Station-A'),
(1, '2026-03-12 07:00:00', '2026-03-12 08:30:00', 40, 85, 90, 1.125, 'Station-A');

-- ============================================================
-- 6. USEFUL VIEWS FOR REPORTING
-- ============================================================

-- View: Daily Delivery Performance
DROP VIEW IF EXISTS v_daily_performance;
CREATE VIEW v_daily_performance AS
SELECT 
    date,
    total_orders,
    completed_orders,
    failed_orders,
    ROUND((completed_orders / total_orders) * 100, 1) AS success_rate_pct,
    avg_delivery_time_minutes,
    on_time_deliveries,
    late_deliveries,
    ROUND((on_time_deliveries / completed_orders) * 100, 1) AS on_time_rate_pct,
    total_revenue
FROM delivery_metrics
ORDER BY date DESC;

-- View: Robot Fleet Status
DROP VIEW IF EXISTS v_robot_fleet_status;
CREATE VIEW v_robot_fleet_status AS
SELECT 
    r.robot_id,
    r.name,
    r.status,
    r.battery,
    CASE 
        WHEN r.battery >= 80 THEN 'GOOD'
        WHEN r.battery >= 50 THEN 'MODERATE'
        WHEN r.battery >= 20 THEN 'LOW'
        ELSE 'CRITICAL'
    END AS battery_status,
    r.pending
FROM robots r;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

SELECT 'Enhancement complete!' AS status;
SELECT 'Categories:' AS info, COUNT(*) AS count FROM categories;
SELECT 'Products:' AS info, COUNT(*) AS count FROM products;
SELECT 'Delivery Metrics:' AS info, COUNT(*) AS count FROM delivery_metrics;
SELECT 'Battery Logs:' AS info, COUNT(*) AS count FROM robot_battery_logs;

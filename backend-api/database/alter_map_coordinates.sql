-- Add map coordinates to delivery_locations and categories for Address/Map alignment
-- Preserves data team's existing schema; extends with map-specific columns
-- Run once. If columns already exist, you may need to comment out the ALTER lines.

USE maxxbyte_robot;

-- Add map coordinates to delivery_locations (percentY, percentX on static map 0-100)
ALTER TABLE delivery_locations ADD COLUMN map_y_percent DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE delivery_locations ADD COLUMN map_x_percent DECIMAL(5,2) DEFAULT NULL;

-- Add map coordinates to categories (restaurants: category_id 1=Pizza Palace, 2=Burger House, 3=Sushi World, 4=Saffron & Serrano)
ALTER TABLE categories ADD COLUMN map_y_percent DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE categories ADD COLUMN map_x_percent DECIMAL(5,2) DEFAULT NULL;

-- Create route waypoints table (restaurant -> delivery location -> ordered waypoints)
CREATE TABLE IF NOT EXISTS map_route_waypoints (
    waypoint_id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    delivery_location_key VARCHAR(50) NOT NULL,
    waypoint_order INT NOT NULL,
    map_y_percent DECIMAL(5,2) NOT NULL,
    map_x_percent DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES categories(category_id),
    UNIQUE KEY unique_route_point (restaurant_id, delivery_location_key, waypoint_order)
);

-- Populate delivery_locations map coordinates (from user-drawn static map)
UPDATE delivery_locations SET map_y_percent = 14, map_x_percent = 52 WHERE location_key = 'campus-north';
UPDATE delivery_locations SET map_y_percent = 58, map_x_percent = 82 WHERE location_key = 'campus-south';
UPDATE delivery_locations SET map_y_percent = 62, map_x_percent = 38 WHERE location_key = 'downtown';
UPDATE delivery_locations SET map_y_percent = 78, map_x_percent = 88 WHERE location_key = 'tech-park';

-- Populate categories (restaurant) map coordinates
UPDATE categories SET map_y_percent = 12, map_x_percent = 18 WHERE category_id = 1;
UPDATE categories SET map_y_percent = 32, map_x_percent = 18 WHERE category_id = 2;
UPDATE categories SET map_y_percent = 48, map_x_percent = 18 WHERE category_id = 3;
UPDATE categories SET map_y_percent = 82, map_x_percent = 22 WHERE category_id = 4;

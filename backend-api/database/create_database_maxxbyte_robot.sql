USE sys;

# ---------------------------------------------------------------------- #
# Target DBMS:           MySQL                                           #
# Project name:          MaxxByteRobot                                   #
# ---------------------------------------------------------------------- #
DROP DATABASE IF EXISTS maxxbyte_robot;

CREATE DATABASE IF NOT EXISTS maxxbyte_robot;

USE maxxbyte_robot;

# ---------------------------------------------------------------------- #
# Core Tables                                                            #
# ---------------------------------------------------------------------- #

CREATE TABLE users (
    user_id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE profiles (
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(200) NOT NULL,
    address VARCHAR(200) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE categories (
    category_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    PRIMARY KEY (category_id)
);

CREATE TABLE products (
    product_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    subcategory VARCHAR(20),
    image_url VARCHAR(200),
    stock INT NOT NULL DEFAULT 0,
    featured BOOL NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE orders (
    order_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    delivery_address VARCHAR(200) NOT NULL,
    delivery_city VARCHAR(50) NOT NULL,
    delivery_state VARCHAR(50) NOT NULL,
    delivery_zip VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    PRIMARY KEY (order_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE order_line_items (
    order_line_item_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    sales_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    PRIMARY KEY (order_line_item_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE shopping_cart (
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE robots (
    robot_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    battery_level INT NOT NULL DEFAULT 100,
    current_location VARCHAR(200),
    current_speed_mph DECIMAL(5, 2) NOT NULL DEFAULT 0,
    on_pedestrian_path BOOL NOT NULL DEFAULT 1,
    street_legal BOOL NOT NULL DEFAULT 0,
    last_updated_at DATETIME,
    PRIMARY KEY (robot_id)
);

CREATE TABLE deliveries (
    delivery_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    robot_id INT,
    status VARCHAR(50) NOT NULL,
    started_at DATETIME,
    completed_at DATETIME,
    pickup_location VARCHAR(200),
    dropoff_location VARCHAR(200),
    PRIMARY KEY (delivery_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (robot_id) REFERENCES robots(robot_id)
);

CREATE TABLE robot_logs (
    log_id INT NOT NULL AUTO_INCREMENT,
    robot_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    battery_level INT NOT NULL,
    location VARCHAR(200),
    speed_mph DECIMAL(5, 2) NOT NULL DEFAULT 0,
    on_pedestrian_path BOOL NOT NULL DEFAULT 1,
    logged_at DATETIME NOT NULL,
    PRIMARY KEY (log_id),
    FOREIGN KEY (robot_id) REFERENCES robots(robot_id)
);

CREATE TABLE delivery_logs (
    log_id INT NOT NULL AUTO_INCREMENT,
    delivery_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    message VARCHAR(255),
    logged_at DATETIME NOT NULL,
    PRIMARY KEY (log_id),
    FOREIGN KEY (delivery_id) REFERENCES deliveries(delivery_id)
);

/* Seed Users */
INSERT INTO users (username, hashed_password, role)
VALUES ('customer1', '$2a$10$NkufUPF3V8dEPSZeo1fzHe9ScBu.LOay9S3N32M84yuUM2OJYEJ/.', 'ROLE_CUSTOMER'),
       ('staff1', '$2a$10$NkufUPF3V8dEPSZeo1fzHe9ScBu.LOay9S3N32M84yuUM2OJYEJ/.', 'ROLE_STAFF'),
       ('admin1', '$2a$10$lfQi9jSfhZZhfS6/Kyzv3u3418IgnWXWDQDk7IbcwlCFPgxg9Iud2', 'ROLE_ADMIN'),
       ('robot1', '$2a$10$NkufUPF3V8dEPSZeo1fzHe9ScBu.LOay9S3N32M84yuUM2OJYEJ/.', 'ROLE_ROBOT');

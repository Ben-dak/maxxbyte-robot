-- Create delivery_locations table for preset delivery addresses
-- Run this script to add delivery locations to the database

USE maxxbyte_robot;

-- Create the delivery_locations table
CREATE TABLE IF NOT EXISTS delivery_locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    location_key VARCHAR(50) NOT NULL UNIQUE,
    location_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'USA',
    card_number VARCHAR(25) DEFAULT NULL,
    card_exp VARCHAR(10) DEFAULT NULL,
    card_cvv VARCHAR(5) DEFAULT NULL,
    billing_address VARCHAR(255) DEFAULT NULL,
    billing_city VARCHAR(100) DEFAULT NULL,
    billing_state VARCHAR(50) DEFAULT NULL,
    billing_zip VARCHAR(20) DEFAULT NULL,
    billing_country VARCHAR(50) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert preset delivery locations
INSERT INTO delivery_locations (location_key, location_name, address, city, state, zip, country, 
    card_number, card_exp, card_cvv, billing_address, billing_city, billing_state, billing_zip, billing_country)
VALUES 
    ('campus-north', 'Campus North - 100 University Ave', '100 University Ave', 'San Jose', 'CA', '95112', 'USA',
     '4111 1111 1111 1111', '12/28', '123', '100 University Ave', 'San Jose', 'CA', '95112', 'USA'),
    
    ('campus-south', 'Campus South - 200 College Blvd', '200 College Blvd', 'San Jose', 'CA', '95113', 'USA',
     '4222 2222 2222 2222', '06/27', '456', '200 College Blvd', 'San Jose', 'CA', '95113', 'USA'),
    
    ('downtown', 'Downtown Hub - 50 Main Street', '50 Main Street', 'San Jose', 'CA', '95110', 'USA',
     '4333 3333 3333 3333', '09/26', '789', '50 Main Street', 'San Jose', 'CA', '95110', 'USA'),
    
    ('tech-park', 'Tech Park - 300 Innovation Dr', '300 Innovation Dr', 'San Jose', 'CA', '95134', 'USA',
     '4444 4444 4444 4444', '03/29', '321', '300 Innovation Dr', 'San Jose', 'CA', '95134', 'USA');

-- Verify the data
SELECT * FROM delivery_locations;

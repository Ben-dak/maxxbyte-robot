-- Add payment/billing fields to profiles. Run once after create_database_maxxbyte_robot.sql
USE maxxbyte_robot;

ALTER TABLE profiles ADD COLUMN name_on_card VARCHAR(100);
ALTER TABLE profiles ADD COLUMN card_number_last4 VARCHAR(4);
ALTER TABLE profiles ADD COLUMN exp_month VARCHAR(2);
ALTER TABLE profiles ADD COLUMN exp_year VARCHAR(4);
ALTER TABLE profiles ADD COLUMN billing_address VARCHAR(200);
ALTER TABLE profiles ADD COLUMN billing_city VARCHAR(50);
ALTER TABLE profiles ADD COLUMN billing_state VARCHAR(50);
ALTER TABLE profiles ADD COLUMN billing_zip VARCHAR(20);
ALTER TABLE profiles ADD COLUMN billing_country VARCHAR(50);
ALTER TABLE profiles ADD COLUMN delivery_country VARCHAR(50);

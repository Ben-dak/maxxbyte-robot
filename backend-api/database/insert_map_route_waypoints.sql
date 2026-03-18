-- Insert route waypoints for campus map (run after alter_map_coordinates.sql)
-- Format: restaurant_id (category_id), delivery_location_key, waypoint_order, map_y_percent, map_x_percent

USE maxxbyte_robot;

DELETE FROM map_route_waypoints WHERE 1=1;

-- Pizza Palace (1) routes
INSERT INTO map_route_waypoints (restaurant_id, delivery_location_key, waypoint_order, map_y_percent, map_x_percent) VALUES
(1,'campus-north',0,12,18),(1,'campus-north',1,14,18),(1,'campus-north',2,16,18),(1,'campus-north',3,18,18),(1,'campus-north',4,18,25),(1,'campus-north',5,18,35),(1,'campus-north',6,18,45),(1,'campus-north',7,18,52),(1,'campus-north',8,16,52),(1,'campus-north',9,14,52),
(1,'campus-south',0,12,18),(1,'campus-south',1,22,18),(1,'campus-south',2,35,18),(1,'campus-south',3,48,18),(1,'campus-south',4,54,25),(1,'campus-south',5,56,45),(1,'campus-south',6,58,65),(1,'campus-south',7,58,82),
(1,'downtown',0,12,18),(1,'downtown',1,25,18),(1,'downtown',2,42,18),(1,'downtown',3,52,22),(1,'downtown',4,58,32),(1,'downtown',5,62,38),
(1,'tech-park',0,12,18),(1,'tech-park',1,25,18),(1,'tech-park',2,42,18),(1,'tech-park',3,55,25),(1,'tech-park',4,65,45),(1,'tech-park',5,72,68),(1,'tech-park',6,78,82),(1,'tech-park',7,78,88);

-- Burger House (2) routes
INSERT INTO map_route_waypoints (restaurant_id, delivery_location_key, waypoint_order, map_y_percent, map_x_percent) VALUES
(2,'campus-north',0,32,18),(2,'campus-north',1,26,18),(2,'campus-north',2,20,18),(2,'campus-north',3,16,18),(2,'campus-north',4,16,28),(2,'campus-north',5,16,40),(2,'campus-north',6,14,52),
(2,'campus-south',0,32,18),(2,'campus-south',1,42,18),(2,'campus-south',2,52,18),(2,'campus-south',3,56,28),(2,'campus-south',4,58,50),(2,'campus-south',5,58,72),(2,'campus-south',6,58,82),
(2,'downtown',0,32,18),(2,'downtown',1,42,18),(2,'downtown',2,52,18),(2,'downtown',3,58,28),(2,'downtown',4,62,36),(2,'downtown',5,62,38),
(2,'tech-park',0,32,18),(2,'tech-park',1,42,18),(2,'tech-park',2,52,18),(2,'tech-park',3,58,30),(2,'tech-park',4,65,50),(2,'tech-park',5,72,72),(2,'tech-park',6,78,85),(2,'tech-park',7,78,88);

-- Sushi World (3) routes
INSERT INTO map_route_waypoints (restaurant_id, delivery_location_key, waypoint_order, map_y_percent, map_x_percent) VALUES
(3,'campus-north',0,48,18),(3,'campus-north',1,40,18),(3,'campus-north',2,30,18),(3,'campus-north',3,20,18),(3,'campus-north',4,16,18),(3,'campus-north',5,16,30),(3,'campus-north',6,16,42),(3,'campus-north',7,14,52),
(3,'campus-south',0,48,18),(3,'campus-south',1,52,22),(3,'campus-south',2,54,35),(3,'campus-south',3,56,52),(3,'campus-south',4,58,70),(3,'campus-south',5,58,82),
(3,'downtown',0,48,18),(3,'downtown',1,54,18),(3,'downtown',2,60,20),(3,'downtown',3,64,28),(3,'downtown',4,62,36),(3,'downtown',5,62,38),
(3,'tech-park',0,48,18),(3,'tech-park',1,52,22),(3,'tech-park',2,54,38),(3,'tech-park',3,58,55),(3,'tech-park',4,68,72),(3,'tech-park',5,76,84),(3,'tech-park',6,78,88);

-- Saffron & Serrano (4) routes
INSERT INTO map_route_waypoints (restaurant_id, delivery_location_key, waypoint_order, map_y_percent, map_x_percent) VALUES
(4,'campus-north',0,82,22),(4,'campus-north',1,78,20),(4,'campus-north',2,70,18),(4,'campus-north',3,58,18),(4,'campus-north',4,45,18),(4,'campus-north',5,30,18),(4,'campus-north',6,18,18),(4,'campus-north',7,16,28),(4,'campus-north',8,16,42),(4,'campus-north',9,14,52),
(4,'campus-south',0,82,22),(4,'campus-south',1,78,20),(4,'campus-south',2,72,22),(4,'campus-south',3,68,30),(4,'campus-south',4,65,48),(4,'campus-south',5,62,68),(4,'campus-south',6,58,82),
(4,'downtown',0,82,22),(4,'downtown',1,78,20),(4,'downtown',2,72,22),(4,'downtown',3,68,28),(4,'downtown',4,65,34),(4,'downtown',5,62,38),
(4,'tech-park',0,82,22),(4,'tech-park',1,78,20),(4,'tech-park',2,72,24),(4,'tech-park',3,68,38),(4,'tech-park',4,70,55),(4,'tech-park',5,74,72),(4,'tech-park',6,78,85),(4,'tech-park',7,78,88);

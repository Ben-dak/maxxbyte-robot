package org.yearup.controllers;

import org.springframework.web.bind.annotation.*;
import org.yearup.data.DeliveryLocationDao;
import org.yearup.data.MapRouteWaypointDao;
import org.yearup.models.Category;
import org.yearup.models.DeliveryLocation;
import org.yearup.models.MapRouteWaypoint;
import org.yearup.data.CategoryDao;

import java.util.*;

@RestController
@RequestMapping("/map")
@CrossOrigin
public class MapController {

    private final DeliveryLocationDao deliveryLocationDao;
    private final CategoryDao categoryDao;
    private final MapRouteWaypointDao mapRouteWaypointDao;

    public MapController(DeliveryLocationDao deliveryLocationDao, CategoryDao categoryDao,
                         MapRouteWaypointDao mapRouteWaypointDao) {
        this.deliveryLocationDao = deliveryLocationDao;
        this.categoryDao = categoryDao;
        this.mapRouteWaypointDao = mapRouteWaypointDao;
    }

    /**
     * Returns map coordinates for the campus map UI.
     * Address/Map alignment: coordinates come from DB to prevent "Lala Land" drift.
     * Returns empty structures if delivery_locations or related tables don't exist yet (campus-map.js uses fallbacks).
     */
    @GetMapping("/campus-data")
    public Map<String, Object> getCampusMapData() {
        Map<String, Object> result = new HashMap<>();
        result.put("deliveryEndpoints", new HashMap<String, List<Double>>());
        result.put("restaurantStarts", new HashMap<String, List<Double>>());
        result.put("routes", new HashMap<String, Map<String, List<List<Double>>>>());

        try {
            Map<String, List<Double>> deliveryEndpoints = new HashMap<>();
            for (DeliveryLocation loc : deliveryLocationDao.getAllActive()) {
                if (loc.getMapYPercent() != null && loc.getMapXPercent() != null) {
                    deliveryEndpoints.put(loc.getLocationKey(), Arrays.asList(
                            loc.getMapYPercent().doubleValue(),
                            loc.getMapXPercent().doubleValue()
                    ));
                }
            }
            result.put("deliveryEndpoints", deliveryEndpoints);

            Map<String, List<Double>> restaurantStarts = new HashMap<>();
            for (Category cat : categoryDao.getCategoriesForMap()) {
                if (cat.getMapYPercent() != null && cat.getMapXPercent() != null) {
                    restaurantStarts.put(String.valueOf(cat.getCategoryId()), Arrays.asList(
                            cat.getMapYPercent().doubleValue(),
                            cat.getMapXPercent().doubleValue()
                    ));
                }
            }
            result.put("restaurantStarts", restaurantStarts);

            Map<String, Map<String, List<List<Double>>>> routes = new HashMap<>();
            for (int restaurantId = 1; restaurantId <= 4; restaurantId++) {
                Map<String, List<List<Double>>> byDelivery = new HashMap<>();
                for (String key : Arrays.asList("campus-north", "campus-south", "downtown", "tech-park")) {
                    List<MapRouteWaypoint> waypoints = mapRouteWaypointDao.getWaypointsForRoute(restaurantId, key);
                    if (!waypoints.isEmpty()) {
                        List<List<Double>> path = new ArrayList<>();
                        for (MapRouteWaypoint wp : waypoints) {
                            if (wp.getMapYPercent() != null && wp.getMapXPercent() != null) {
                                path.add(Arrays.asList(wp.getMapYPercent().doubleValue(), wp.getMapXPercent().doubleValue()));
                            }
                        }
                        byDelivery.put(key, path);
                    }
                }
                routes.put(String.valueOf(restaurantId), byDelivery);
            }
            result.put("routes", routes);
        } catch (Exception e) {
            System.err.println("MapController: delivery_locations or related tables may not exist. Run create_delivery_locations.sql. " + e.getMessage());
        }

        return result;
    }
}

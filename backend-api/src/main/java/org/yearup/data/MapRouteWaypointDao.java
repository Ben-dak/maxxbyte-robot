package org.yearup.data;

import org.yearup.models.MapRouteWaypoint;

import java.util.List;

public interface MapRouteWaypointDao {
    List<MapRouteWaypoint> getWaypointsForRoute(int restaurantId, String deliveryLocationKey);
}

package org.yearup.models;

import java.math.BigDecimal;

public class MapRouteWaypoint {
    private int waypointId;
    private int restaurantId;
    private String deliveryLocationKey;
    private int waypointOrder;
    private BigDecimal mapYPercent;
    private BigDecimal mapXPercent;

    public int getWaypointId() {
        return waypointId;
    }

    public void setWaypointId(int waypointId) {
        this.waypointId = waypointId;
    }

    public int getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(int restaurantId) {
        this.restaurantId = restaurantId;
    }

    public String getDeliveryLocationKey() {
        return deliveryLocationKey;
    }

    public void setDeliveryLocationKey(String deliveryLocationKey) {
        this.deliveryLocationKey = deliveryLocationKey;
    }

    public int getWaypointOrder() {
        return waypointOrder;
    }

    public void setWaypointOrder(int waypointOrder) {
        this.waypointOrder = waypointOrder;
    }

    public BigDecimal getMapYPercent() {
        return mapYPercent;
    }

    public void setMapYPercent(BigDecimal mapYPercent) {
        this.mapYPercent = mapYPercent;
    }

    public BigDecimal getMapXPercent() {
        return mapXPercent;
    }

    public void setMapXPercent(BigDecimal mapXPercent) {
        this.mapXPercent = mapXPercent;
    }
}

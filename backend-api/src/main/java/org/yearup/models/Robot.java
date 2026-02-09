package org.yearup.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Robot {
    private int robotId;
    private String name;
    private String status;
    private int batteryLevel;
    private String currentLocation;
    private BigDecimal currentSpeedMph;
    private boolean onPedestrianPath;
    private boolean streetLegal;
    private LocalDateTime lastUpdatedAt;

    public Robot() {
    }

    public Robot(int robotId, String name, String status, int batteryLevel, String currentLocation,
                 BigDecimal currentSpeedMph, boolean onPedestrianPath, boolean streetLegal,
                 LocalDateTime lastUpdatedAt) {
        this.robotId = robotId;
        this.name = name;
        this.status = status;
        this.batteryLevel = batteryLevel;
        this.currentLocation = currentLocation;
        this.currentSpeedMph = currentSpeedMph;
        this.onPedestrianPath = onPedestrianPath;
        this.streetLegal = streetLegal;
        this.lastUpdatedAt = lastUpdatedAt;
    }

    public int getRobotId() {
        return robotId;
    }

    public void setRobotId(int robotId) {
        this.robotId = robotId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getBatteryLevel() {
        return batteryLevel;
    }

    public void setBatteryLevel(int batteryLevel) {
        this.batteryLevel = batteryLevel;
    }

    public String getCurrentLocation() {
        return currentLocation;
    }

    public void setCurrentLocation(String currentLocation) {
        this.currentLocation = currentLocation;
    }

    public BigDecimal getCurrentSpeedMph() {
        return currentSpeedMph;
    }

    public void setCurrentSpeedMph(BigDecimal currentSpeedMph) {
        this.currentSpeedMph = currentSpeedMph;
    }

    public boolean isOnPedestrianPath() {
        return onPedestrianPath;
    }

    public void setOnPedestrianPath(boolean onPedestrianPath) {
        this.onPedestrianPath = onPedestrianPath;
    }

    public boolean isStreetLegal() {
        return streetLegal;
    }

    public void setStreetLegal(boolean streetLegal) {
        this.streetLegal = streetLegal;
    }

    public LocalDateTime getLastUpdatedAt() {
        return lastUpdatedAt;
    }

    public void setLastUpdatedAt(LocalDateTime lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt;
    }
}

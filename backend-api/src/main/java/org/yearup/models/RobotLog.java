package org.yearup.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RobotLog {
    private int logId;
    private int robotId;
    private String status;
    private int batteryLevel;
    private String location;
    private BigDecimal speedMph;
    private boolean onPedestrianPath;
    private LocalDateTime loggedAt;

    public RobotLog() {
    }

    public RobotLog(int logId, int robotId, String status, int batteryLevel, String location,
                    BigDecimal speedMph, boolean onPedestrianPath, LocalDateTime loggedAt) {
        this.logId = logId;
        this.robotId = robotId;
        this.status = status;
        this.batteryLevel = batteryLevel;
        this.location = location;
        this.speedMph = speedMph;
        this.onPedestrianPath = onPedestrianPath;
        this.loggedAt = loggedAt;
    }

    public int getLogId() {
        return logId;
    }

    public void setLogId(int logId) {
        this.logId = logId;
    }

    public int getRobotId() {
        return robotId;
    }

    public void setRobotId(int robotId) {
        this.robotId = robotId;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public BigDecimal getSpeedMph() {
        return speedMph;
    }

    public void setSpeedMph(BigDecimal speedMph) {
        this.speedMph = speedMph;
    }

    public boolean isOnPedestrianPath() {
        return onPedestrianPath;
    }

    public void setOnPedestrianPath(boolean onPedestrianPath) {
        this.onPedestrianPath = onPedestrianPath;
    }

    public LocalDateTime getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(LocalDateTime loggedAt) {
        this.loggedAt = loggedAt;
    }
}

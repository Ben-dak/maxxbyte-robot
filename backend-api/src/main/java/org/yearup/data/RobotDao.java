package org.yearup.data;

import org.yearup.models.Robot;

import java.util.List;

public interface RobotDao {
    List<Robot> getAll();
    Robot getById(int robotId);
    Robot create(Robot robot);
    void updateStatus(Robot robot);
}

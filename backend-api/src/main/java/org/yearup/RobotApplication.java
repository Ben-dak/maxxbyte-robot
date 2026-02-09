package org.yearup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RobotApplication
{
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(RobotApplication.class);
        app.run(args);
    }
}

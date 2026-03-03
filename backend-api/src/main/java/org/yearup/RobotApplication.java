package org.yearup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RobotApplication
{
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(RobotApplication.class);
        app.run(args);
    }
}

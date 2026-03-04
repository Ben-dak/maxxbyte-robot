package org.yearup;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Component;

@SpringBootApplication
@EnableScheduling
public class RobotApplication
{
    public static void main(String[] args) {
        SpringApplication.run(RobotApplication.class, args);
    }
}

@Component
class BrowserLauncher implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        try {
            String url = "http://localhost:8080";
            String os = System.getProperty("os.name").toLowerCase();
            
            if (os.contains("win")) {
                Runtime.getRuntime().exec("rundll32 url.dll,FileProtocolHandler " + url);
            } else if (os.contains("mac")) {
                Runtime.getRuntime().exec("open " + url);
            } else {
                Runtime.getRuntime().exec("xdg-open " + url);
            }
            
            System.out.println("Browser opened to: " + url);
        } catch (Exception e) {
            System.out.println("Could not open browser automatically. Please navigate to: http://localhost:8080");
        }
    }
}

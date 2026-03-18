package org.yearup.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.yearup.data.DeliveryLocationDao;
import org.yearup.models.DeliveryLocation;

import java.util.List;

@RestController
@RequestMapping("/delivery-locations")
@CrossOrigin
public class DeliveryLocationController {

    private final DeliveryLocationDao deliveryLocationDao;

    public DeliveryLocationController(DeliveryLocationDao deliveryLocationDao) {
        this.deliveryLocationDao = deliveryLocationDao;
    }

    @GetMapping
    public List<DeliveryLocation> getAllLocations() {
        try {
            return deliveryLocationDao.getAllActive();
        } catch (Exception e) {
            System.err.println("DeliveryLocationController: delivery_locations table may not exist. Run create_delivery_locations.sql. " + e.getMessage());
            return List.of();
        }
    }

    @GetMapping("/{locationKey}")
    public DeliveryLocation getByKey(@PathVariable String locationKey) {
        try {
            DeliveryLocation location = deliveryLocationDao.getByKey(locationKey);
            if (location == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Location not found: " + locationKey);
            }
            return location;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving location");
        }
    }
}

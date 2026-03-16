package org.yearup.data;

import org.yearup.models.DeliveryLocation;
import java.util.List;

public interface DeliveryLocationDao {
    List<DeliveryLocation> getAllActive();
    DeliveryLocation getByKey(String locationKey);
    DeliveryLocation getById(int locationId);
}

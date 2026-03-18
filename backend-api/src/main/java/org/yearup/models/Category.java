package org.yearup.models;

import java.math.BigDecimal;

public class Category
{
    private int categoryId;
    private String name;
    private String description;
    private BigDecimal mapYPercent;
    private BigDecimal mapXPercent;

    public Category()
    {
    }

    public Category(int categoryId, String name, String description)
    {
        this.categoryId = categoryId;
        this.name = name;
        this.description = description;
    }

    public int getCategoryId()
    {
        return categoryId;
    }

    public void setCategoryId(int categoryId)
    {
        this.categoryId = categoryId;
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getDescription()
    {
        return description;
    }

    public void setDescription(String description)
    {
        this.description = description;
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

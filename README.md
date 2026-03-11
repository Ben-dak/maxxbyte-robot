# BiteBot - Food Delivery Robot Application

A food delivery robot management system featuring a customer-facing web application for ordering food and tracking deliveries via autonomous robots.

---

## Project Overview

BiteBot is a full-stack web application that allows customers to:
- Browse restaurant menus and place orders
- Track delivery status in real-time via robot delivery
- Manage their profile and payment information

The system includes automated delivery scheduling with a 20-minute delivery SLA.

---

## Prerequisites

- **Java 17** (Amazon Corretto recommended)
- **MySQL 8.0+**
- **IntelliJ IDEA** (Community or Ultimate)

---

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maxxbyte-robot
   ```

2. **Set up the database** (see Database Setup below)

3. **Open in IntelliJ IDEA**
   - Open the `backend-api` folder as a Maven project
   - Wait for dependencies to download

4. **Run the application**
   - Run `RobotApplication.java`
   - Browser automatically opens to `http://localhost:8080`

---

## Database Setup

### Fix "Access denied for user 'root'@'localhost'" Error

If you see this error, the app's MySQL password doesn't match your MySQL `root` password.

#### Option A: Environment Variable (Recommended)

**Windows (PowerShell):**
```powershell
$env:DATASOURCE_PASSWORD = "YourMySqlRootPassword"
```

**Windows (Command Prompt):**
```cmd
set DATASOURCE_PASSWORD=YourMySqlRootPassword
```

**Or set it in IntelliJ:** Edit your run configuration and add environment variable `DATASOURCE_PASSWORD` = your MySQL root password.

#### Option B: Override in a Local Properties File

1. In `src/main/resources/`, create `application-local.properties` (add to `.gitignore`)
2. Add:
   ```properties
   datasource.password=YourMySqlRootPassword
   ```
3. Start the app with `-Dspring.profiles.active=local`

#### Option C: Change the Main Config

Edit `src/main/resources/application.properties` and change:
```properties
datasource.password=yearup
```
to your MySQL root password.

### Create the Database and Tables

1. Make sure MySQL is running
2. Run one of these SQL scripts in MySQL Workbench:
   - **First-time setup:** `database/create_database_maxxbyte_robot.sql`
   - **Existing DB, adding payment columns:** `database/alter_profiles_payment.sql`

3. Restart the application

---

## Tech Stack

- **Backend:** Java Spring Boot, Spring Security, JWT Authentication
- **Frontend:** HTML, CSS, JavaScript (jQuery, Axios, Mustache.js)
- **Database:** MySQL
- **Mapping:** Campus map for delivery tracking

---

## Key Features

- User registration and authentication
- Restaurant menu browsing
- Shopping cart with slide-in overlay
- Order placement and tracking
- Automated delivery status updates
- Robot assignment and delivery logging

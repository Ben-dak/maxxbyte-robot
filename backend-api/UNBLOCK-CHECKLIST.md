# Unblock checklist (DB connection → Account Sync & Secure Access)

If you're **blocked** by:
- `java.sql.SQLException: Cannot create PoolableConnectionFactory (Access denied for user 'root'@'localhost')`
- Login failed on the frontend
- Unable to audit **Account Sync (TC-001)** or **Secure Access (TC-005)** because the seed user never gets created

Follow these steps to unblock.

---

## Step 1: Fix the database password

The app needs to connect to MySQL as `root`. The default password in config is `yearup`. If your MySQL `root` password is different, do one of the following.

**Option A – Environment variable (recommended)**  
Before starting the backend, in the same terminal:

- **PowerShell:** `$env:DATASOURCE_PASSWORD = "YourActualMySqlRootPassword"`
- **Cmd:** `set DATASOURCE_PASSWORD=YourActualMySqlRootPassword`

**Option B – In your IDE**  
Run → Edit Configurations → select the app → Environment variables → add `DATASOURCE_PASSWORD` = your MySQL root password.

**Option C – Your password is already `yearup`**  
If your MySQL `root` password is `yearup`, you don’t need to set anything. The app uses `yearup` by default. Just ensure MySQL is running and the database exists (Step 2), then start the backend (Step 3).

Full details: [DATABASE-SETUP.md](DATABASE-SETUP.md).

---

## Step 2: Ensure MySQL is running and the database exists

1. Start MySQL (e.g. from Services or your MySQL installer).
2. If this is first-time setup, run in MySQL:
   - `backend-api/database/create_database_maxxbyte_robot.sql`

---

## Step 3: Start the backend

Start the Spring Boot app (e.g. run `RobotApplication`). You should **not** see:
- "Access denied for user 'root'@'localhost'"
- "Could not create seed user 'coralestrada28'"

If the DB connection is OK, the seed user is created automatically on startup.

---

## Step 4: (Optional) Create the seed user manually

If the user wasn’t created at startup (e.g. DB was down earlier), open in a browser:

**http://localhost:8080/api/seed-user**

You should see a message that the account was created (or that it already exists).

---

## Step 5: Verify login (TC-001 / TC-005)

1. Open the frontend and go to the login page.
2. Log in with:
   - **Username:** `coralestrada28`
   - **Password:** `BiteBot4life`
3. If login succeeds, you’re unblocked and can complete the Account Sync and Secure Access audits.

---

## Quick reference

| Item | Value |
|------|--------|
| Test username | `coralestrada28` |
| Test password | `BiteBot4life` |
| Seed user endpoint | `GET http://localhost:8080/api/seed-user` |
| Where credentials are defined | `SeedCoralUserRunner.java`, `SeedController.java` |

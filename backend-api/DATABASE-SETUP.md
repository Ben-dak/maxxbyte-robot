# Database setup

The error **"Access denied for user 'root'@'localhost' (using password: YES)"** means the app’s MySQL password doesn’t match your MySQL `root` password.

## 1. Use your MySQL root password

Pick one of these:

### Option A: Environment variable (recommended)

Before starting the app, set the password your MySQL `root` user actually uses:

**Windows (PowerShell):**
```powershell
$env:DATASOURCE_PASSWORD = "YourMySqlRootPassword"
```
Then start the Spring Boot app in the same terminal.

**Windows (Command Prompt):**
```cmd
set DATASOURCE_PASSWORD=YourMySqlRootPassword
```

**Or set it in your IDE:**  
Edit your run configuration and add environment variable `DATASOURCE_PASSWORD` = your MySQL root password.

### Option B: Override in a local properties file

1. In `src/main/resources/`, create a file named `application-local.properties` (add it to `.gitignore` if you don’t want to commit it).
2. Put in it:
   ```properties
   datasource.password=YourMySqlRootPassword
   ```
3. Start the app with the `local` profile, e.g.:
   ```text
   -Dspring.profiles.active=local
   ```
   or set `spring.profiles.active=local` in that file.

### Option C: Change the main config

Edit `src/main/resources/application.properties` and change the line:

```properties
datasource.password=yearup#99
```

to whatever your MySQL `root` password is (or leave it empty if root has no password):

```properties
datasource.password=
```

## 2. Create the database and tables

1. Make sure MySQL is running.
2. Create the database and tables (one of these, depending on what you have):
   - **First-time setup:** run `database/create_database_maxxbyte_robot.sql` in MySQL.
   - **Existing DB, adding payment columns:** run `database/alter_profiles_payment.sql`.

## 3. Restart the app

After fixing the password and (if needed) running the SQL, restart the backend and try again (e.g. open `/api/seed-user` or log in).

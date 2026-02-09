# Create user: coralestrada28 / BiteBot4life

## Option 1: Seed endpoint (easiest)

1. **Start the backend** (Spring Boot on http://localhost:8080).
2. **Open in your browser:**  
   **http://localhost:8080/api/seed-user**
3. You should see: `"Account created. Log in with username: coralestrada28 and password: BiteBot4life"`.
4. Go back to the app and log in with **coralestrada28** / **BiteBot4life**.

If the user already exists, the page will say so and you can log in with the same credentials.

## Option 2: PowerShell

1. **Start the backend** so it is running on `http://localhost:8080`.
2. From the project root, run:
   ```powershell
   .\scripts\create-user-coralestrada28.ps1
   ```
3. If you see "Account created successfully", log in with:
   - **Username:** coralestrada28  
   - **Password:** BiteBot4life  

If the user already exists (e.g. you ran the script before), you can log in with the same credentials.

## Option 2: curl (any terminal)

With the backend running:

```bash
curl -X POST http://localhost:8080/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"coralestrada28\",\"password\":\"BiteBot4life\",\"confirmPassword\":\"BiteBot4life\",\"role\":\"ROLE_CUSTOMER\"}"
```

On Linux/macOS use single quotes and no `^`:

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"coralestrada28","password":"BiteBot4life","confirmPassword":"BiteBot4life","role":"ROLE_CUSTOMER"}'
```

## Option 3: From the frontend

If the app has a registration form, create the account there with:

- **Username:** coralestrada28  
- **Password:** BiteBot4life  
- **Confirm password:** BiteBot4life  
- **Role:** CUSTOMER (or ROLE_CUSTOMER if required)

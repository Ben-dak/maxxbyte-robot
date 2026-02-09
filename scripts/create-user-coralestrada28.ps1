# Create BiteBot user: coralestrada28 / BiteBot4life
# Run with: .\scripts\create-user-coralestrada28.ps1
# Ensure the backend is running on http://localhost:8080 first.

$baseUrl = "http://localhost:8080"
$body = @{
    username         = "coralestrada28"
    password         = "BiteBot4life"
    confirmPassword  = "BiteBot4life"
    role             = "ROLE_CUSTOMER"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Account created successfully for username: coralestrada28" -ForegroundColor Green
    Write-Host "You can now log in with password: BiteBot4life"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "User 'coralestrada28' may already exist. Try logging in with that username and password." -ForegroundColor Yellow
    } else {
        Write-Host "Error (HTTP $statusCode): Backend may not be running or returned an error." -ForegroundColor Red
        Write-Host "1. Start the backend (e.g. run the Spring Boot app on port 8080)."
        Write-Host "2. Run this script again: .\scripts\create-user-coralestrada28.ps1"
        if ($_.ErrorDetails.Message) { Write-Host "Details: $($_.ErrorDetails.Message)" }
    }
}

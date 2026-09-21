$headers = @{"Content-Type" = "application/json"}
$body = '{"username":"admin","password":"admin123"}'
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers $headers -Body $body -UseBasicParsing
$content = $response.Content | ConvertFrom-Json
$token = $content.access

Write-Host "Token: $token"

# Create headers with proper variable expansion
$headers2 = @{}
$headers2["Authorization"] = "Bearer " + $token
$headers2["Content-Type"] = "application/json"

Write-Host "Authorization header: $($headers2['Authorization'])"

$response2 = Invoke-WebRequest -Uri "http://localhost:3000/api/users/14" -Method GET -Headers $headers2 -UseBasicParsing
Write-Host $response2.Content

# QuickShow API Test Script
# Tests all backend endpoints to verify functionality

$baseUrl = "http://localhost:5001"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$endpoint,
        [string]$method = "GET",
        [hashtable]$body = $null,
        [string]$description
    )
    
    Write-Host "`n🧪 Testing: $description" -ForegroundColor Cyan
    Write-Host "   Endpoint: $method $endpoint" -ForegroundColor Gray
    
    try {
        $fullUrl = "$baseUrl$endpoint"
        
        if ($method -eq "GET") {
            $response = Invoke-WebRequest -Uri $fullUrl -UseBasicParsing -TimeoutSec 10
        } elseif ($method -eq "POST") {
            $jsonBody = $body | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $fullUrl -Method POST -Body $jsonBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        }
        
        $data = $response.Content | ConvertFrom-Json
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200 -or $statusCode -eq 201) {
            if ($data.success -eq $true) {
                Write-Host "   ✅ PASS - Success: $($data.success)" -ForegroundColor Green
                if ($data.data -and $data.data.Count) {
                    Write-Host "   📊 Data Count: $($data.data.Count)" -ForegroundColor Green
                }
                if ($data.message) {
                    Write-Host "   💬 Message: $($data.message)" -ForegroundColor Yellow
                }
                if ($data.source) {
                    Write-Host "   🔗 Source: $($data.source)" -ForegroundColor Magenta
                }
                $script:testResults += @{ Endpoint = $endpoint; Status = "PASS"; Details = "Success: $($data.success)" }
            } else {
                Write-Host "   ⚠️  PARTIAL - API responded but success=false" -ForegroundColor Yellow
                Write-Host "   📝 Message: $($data.message)" -ForegroundColor Yellow
                $script:testResults += @{ Endpoint = $endpoint; Status = "PARTIAL"; Details = $data.message }
            }
        } else {
            Write-Host "   ❌ FAIL - HTTP $statusCode" -ForegroundColor Red
            $script:testResults += @{ Endpoint = $endpoint; Status = "FAIL"; Details = "HTTP $statusCode" }
        }
    }
    catch {
        Write-Host "   ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{ Endpoint = $endpoint; Status = "FAIL"; Details = $_.Exception.Message }
    }
}

Write-Host "🚀 QuickShow API Test Suite" -ForegroundColor Yellow
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host "=" * 60

# Core Health Check
Test-Endpoint "/health" -Description "Health Check"

# Movie Endpoints
Test-Endpoint "/api/movie/latest" -Description "Latest Movies"
Test-Endpoint "/api/movie/trending" -Description "Trending Movies"
Test-Endpoint "/api/movie/now-playing" -Description "Now Playing Movies"
Test-Endpoint "/api/movie/popular" -Description "Popular Movies"
Test-Endpoint "/api/movie/upcoming" -Description "Upcoming Movies"

# Search Endpoints
Test-Endpoint "/api/movie/search?query=fight" -Description "Movie Search (fight)"
Test-Endpoint "/api/movie/search?query=avatar" -Description "Movie Search (avatar)"
Test-Endpoint "/api/movie/search-tmdb?query=inception" -Description "TMDB Search"

# Movie Details (using fallback movie IDs)
Test-Endpoint "/api/movie/550" -Description "Movie Details (Fight Club - ID 550)"
Test-Endpoint "/api/movie/278" -Description "Movie Details (Shawshank - ID 278)"

# Show/Booking Endpoints (may fail due to auth requirements - that's expected)
Test-Endpoint "/api/show/list" -Description "Show List (may require auth)"

# AI Endpoints (will likely fail due to auth - that's expected)
Test-Endpoint "/api/ai/chat" -method "POST" -body @{ message = "hello" } -Description "AI Chat (will fail - needs auth)"

# Admin Analytics (will fail due to auth - that's expected)
Test-Endpoint "/api/admin/analytics/overview" -Description "Admin Analytics (will fail - needs auth)"

Write-Host "`n" + "=" * 60
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Yellow
Write-Host "=" * 60

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$partialCount = ($testResults | Where-Object { $_.Status -eq "PARTIAL" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $testResults.Count

Write-Host "✅ PASSED: $passCount" -ForegroundColor Green
Write-Host "⚠️  PARTIAL: $partialCount" -ForegroundColor Yellow
Write-Host "❌ FAILED: $failCount" -ForegroundColor Red
Write-Host "📈 TOTAL: $totalCount" -ForegroundColor Cyan

Write-Host "`nDETAILED RESULTS:" -ForegroundColor Yellow
foreach ($result in $testResults) {
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "PARTIAL" { "Yellow" }
        "FAIL" { "Red" }
    }
    Write-Host "  $($result.Status.PadRight(8)) $($result.Endpoint) - $($result.Details)" -ForegroundColor $color
}

if ($passCount -ge 8) {
    Write-Host "`n🎉 OVERALL ASSESSMENT: GOOD - Core movie endpoints are working!" -ForegroundColor Green
    Write-Host "   The movie display issue should be resolved." -ForegroundColor Green
    Write-Host "   Auth-protected endpoints failing is expected without login." -ForegroundColor Yellow
} elseif ($passCount -ge 5) {
    Write-Host "`n⚠️  OVERALL ASSESSMENT: PARTIAL - Some issues detected" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ OVERALL ASSESSMENT: POOR - Major issues detected" -ForegroundColor Red
}

Write-Host "`n💡 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Visit http://localhost:5173/movies to check if movies display" -ForegroundColor Gray
Write-Host "2. Check browser console for any frontend errors" -ForegroundColor Gray
Write-Host "3. Configure MongoDB connection if you want real data persistence" -ForegroundColor Gray
Write-Host "4. Test admin features after signing in as admin user" -ForegroundColor Gray
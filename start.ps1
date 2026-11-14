# Campus Marketplace - Single-Command Startup Script for Windows PowerShell
# Course: CSC203B Software Development Fundamentals
# Institution: M.S. Ramaiah University of Applied Sciences (@msruas.ac.in)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CAMPUS MARKETPLACE - MSRUAS STUDENT NOTICE BOARD       " -ForegroundColor Yellow
Write-Host "   Course: CSC203B Software Development Fundamentals      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Locate and configure OpenJDK 21 for the Firebase Emulator Suite
$jdkPaths = @(
    "C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot",
    "C:\Program Files\Java\jdk-21*",
    "C:\Program Files\Eclipse Adoptium\jdk-21*"
)

$foundJdk = $null
foreach ($path in $jdkPaths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        $foundJdk = $resolved[0].Path
        break
    }
}

if ($foundJdk) {
    $env:JAVA_HOME = $foundJdk
    $env:PATH = "$foundJdk\bin;" + $env:PATH
    Write-Host "[OK] Using Java 21 Runtime: $foundJdk" -ForegroundColor Green
} elseif ($env:JAVA_HOME -and (Test-Path $env:JAVA_HOME)) {
    Write-Host "[OK] Using configured JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
} else {
    Write-Host "[WARN] Java 21 not found in standard paths. Attempting system default." -ForegroundColor Yellow
}

# 2. Ensure .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "[SETUP] .env.local not found. Creating from .env.local.example..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "[OK] Created .env.local with emulator defaults." -ForegroundColor Green
}

# 3. Ensure dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "[SETUP] node_modules not found. Installing dependencies via npm install..." -ForegroundColor Yellow
    npm install
}

# 4. Check whether to run against local emulators or live Google Cloud
$isEmulator = $true
if (Test-Path ".env.local") {
    $envLines = Get-Content ".env.local"
    foreach ($line in $envLines) {
        if ($line -match '^\s*NEXT_PUBLIC_USE_FIREBASE_EMULATOR\s*=\s*["'']?false["'']?') {
            $isEmulator = $false
            break
        }
    }
}

if ($isEmulator) {
    Write-Host "[MODE] Running against LOCAL FIREBASE EMULATOR" -ForegroundColor Cyan
    Write-Host "[START] Launching Firebase Emulator Suite in background window..." -ForegroundColor Cyan
    $emulatorCommand = "`$Host.UI.RawUI.WindowTitle = 'Firebase Emulator Suite (Auth: 9099 | Firestore: 8080 | UI: 4000)'; "
    if ($foundJdk) {
        $emulatorCommand += "`$env:JAVA_HOME = '$foundJdk'; `$env:PATH = '$foundJdk\bin;' + `$env:PATH; "
    }
    $emulatorCommand += "npx firebase-tools emulators:start --only auth,firestore"

    Start-Process powershell -ArgumentList "-NoExit", "-Command", $emulatorCommand

    # Wait briefly for emulator ports to become ready
    Write-Host "[WAIT] Waiting 5 seconds for emulators to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "[MODE] Running against LIVE GOOGLE CLOUD FIRESTORE (campus-marketplace-46e4d)" -ForegroundColor Green
    Write-Host "[INFO] Skipping local emulator startup since live cloud is configured." -ForegroundColor Green
}

# 5. Seed test accounts and realistic campus listings if needed
Write-Host "[SEED] Populating / verifying demo accounts and campus listings..." -ForegroundColor Cyan
npm run seed

# 7. Launch browser at http://localhost:3000
Write-Host "[OPEN] Opening http://localhost:3000 in your browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

# 8. Start Next.js Development Server
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Next.js Development Server starting on Port 3000       " -ForegroundColor Yellow
Write-Host "   Seeded Accounts:                                       " -ForegroundColor Cyan
Write-Host "   - Admin:    admin@msruas.ac.in        (CampusAdmin@2024)" -ForegroundColor White
Write-Host "   - Verifier: verifier@msruas.ac.in     (CampusVerifier@2024)" -ForegroundColor White
Write-Host "   - Student:  aarav.sharma@msruas.ac.in (StudentPass@2024)" -ForegroundColor White
Write-Host "   - Student:  priya.patel@msruas.ac.in  (StudentPass@2024)" -ForegroundColor White
Write-Host "   - Student:  rohit.kumar@msruas.ac.in  (StudentPass@2024)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in this terminal to stop the Next.js server." -ForegroundColor DarkGray

npm run dev


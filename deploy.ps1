# Deployment Configuration
$PI_USER = "pi"
$PI_HOST = "192.168.100.100"  # Your Pi's IP
$FRONTEND_BUILD_DIR = "./website-frontend/dist"
$BACKEND_SOURCE_FILE = "./website-backend/main.py"
$BACKEND_ENV_FILE = "./website-backend/.env"  # Added .env file transfer
$PI_TEMP_DIR = "~/infizity_deploy"
$PI_WWW_DIR = "/var/www/infizity"
$PI_BACKEND_DIR = "~/website-backend"

# Function to update .env files for production
function Set-ProductionEnv {
    # Frontend .env
    $frontendEnvPath = "./website-frontend/.env"
    if (Test-Path $frontendEnvPath) {
        (Get-Content $frontendEnvPath) `
            -replace 'API_URL="http://localhost:8001"', 'API_URL="https://api.infizity.com"' `
            -replace 'FRONTEND_URL="http://localhost:5173"', 'FRONTEND_URL="https://infizity.com"' `
            -replace 'JITSI_URL="https://localhost:8443"', 'JITSI_URL="https://jitsi.infizity.com"' |
        Set-Content $frontendEnvPath
    }

    # Backend .env
    $backendEnvPath = "./website-backend/.env"
    if (Test-Path $backendEnvPath) {
        (Get-Content $backendEnvPath) `
            -replace 'API_URL = "http://localhost:8001"', 'API_URL = "https://api.infizity.com"' `
            -replace 'JITSI_URL = "http://localhost:8443"', 'JITSI_URL = "https://jitsi.infizity.com"' |
        Set-Content $backendEnvPath
    }
}

# Function to revert .env files to development
function Set-DevelopmentEnv {
    # Frontend .env
    $frontendEnvPath = "./website-frontend/.env"
    if (Test-Path $frontendEnvPath) {
        (Get-Content $frontendEnvPath) `
            -replace 'API_URL="https://api.infizity.com"', 'API_URL="http://localhost:8001"' `
            -replace 'FRONTEND_URL="https://infizity.com"', 'FRONTEND_URL="http://localhost:5173"' `
            -replace 'JITSI_URL="https://jitsi.infizity.com"', 'JITSI_URL="https://localhost:8443"' |
        Set-Content $frontendEnvPath
    }

    # Backend .env
    $backendEnvPath = "./website-backend/.env"
    if (Test-Path $backendEnvPath) {
        (Get-Content $backendEnvPath) `
            -replace 'API_URL = "https://api.infizity.com"', 'API_URL = "http://localhost:8001"' `
            -replace 'JITSI_DOMAIN = "https://jitsi.infizity.com"', 'JITSI_DOMAIN = "http://localhost:8443"' |
        Set-Content $backendEnvPath
    }
}

# 1. Update environment variables for production
Write-Host "Updating environment variables for production..."
Set-ProductionEnv

# 2. Build frontend project
Write-Host "Building frontend project..."
Set-Location "./website-frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    Set-DevelopmentEnv
    exit 1
}
Set-Location "../"

# 3. Transfer frontend files (will prompt for password)
Write-Host "Uploading frontend files to Pi..."
scp -r "$FRONTEND_BUILD_DIR/*" "${PI_USER}@${PI_HOST}:${PI_TEMP_DIR}"

# 4. Transfer backend files (will prompt for password)
Write-Host "Uploading backend files to Pi..."
scp "$BACKEND_SOURCE_FILE" "${PI_USER}@${PI_HOST}:${PI_BACKEND_DIR}/"
scp "$BACKEND_ENV_FILE" "${PI_USER}@${PI_HOST}:${PI_BACKEND_DIR}/"  # Added .env transfer

# 5. Execute remote deployment commands (will prompt for password)
Write-Host "Running deployment on Pi..."
$DEPLOY_COMMANDS = @"
sudo rm -rf $PI_WWW_DIR/*
sudo cp -r $PI_TEMP_DIR/* $PI_WWW_DIR/
sudo chown -R www-data:www-data $PI_WWW_DIR
sudo find $PI_WWW_DIR -type d -exec chmod 750 {} \;
sudo find $PI_WWW_DIR -type f -exec chmod 640 {} \;
rm -rf $PI_TEMP_DIR
sudo systemctl restart infizity-api.service
"@

ssh "${PI_USER}@${PI_HOST}" "$DEPLOY_COMMANDS"

# 6. Revert environment variables to development
Write-Host "Reverting environment variables to development values..."
Set-DevelopmentEnv

Write-Host "Deployment complete!" -ForegroundColor Green
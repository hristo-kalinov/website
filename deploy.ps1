# Deployment Configuration
$PI_USER = "root"
$PI_HOST = "49.12.32.80"
$FRONTEND_BUILD_DIR = "./website-frontend/dist"
$BACKEND_SOURCE_FILE = "./website-backend/main.py"
$BACKEND_ENV_FILE = "./website-backend/.env"
$PI_TEMP_DIR = "/tmp/infizity_deploy"
$PI_WWW_DIR = "/var/www/infizity"
$PI_BACKEND_DIR = "/infizity/backend"

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
    $frontendEnvPath = "./website-frontend/.env"
    if (Test-Path $frontendEnvPath) {
        (Get-Content $frontendEnvPath) `
            -replace 'API_URL="https://api.infizity.com"', 'API_URL="http://localhost:8001"' `
            -replace 'FRONTEND_URL="https://infizity.com"', 'FRONTEND_URL="http://localhost:5173"' `
            -replace 'JITSI_URL="https://jitsi.infizity.com"', 'JITSI_URL="https://localhost:8443"' |
        Set-Content $frontendEnvPath
    }

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

# 3. Transfer frontend files
Write-Host "Uploading frontend files to server..."
ssh "$PI_USER@$PI_HOST" "mkdir -p $PI_TEMP_DIR"
scp -r "$FRONTEND_BUILD_DIR/*" "${PI_USER}@${PI_HOST}:$PI_TEMP_DIR/"

# 4. Transfer backend files
Write-Host "Uploading backend files to server..."
scp "$BACKEND_SOURCE_FILE" "${PI_USER}@${PI_HOST}:$PI_BACKEND_DIR/"
scp "$BACKEND_ENV_FILE" "${PI_USER}@${PI_HOST}:$PI_BACKEND_DIR/"

# 5. Execute remote deployment commands
Write-Host "Running deployment on server..."
$DEPLOY_COMMANDS = @"
rm -rf $PI_WWW_DIR/*
cp -r $PI_TEMP_DIR/* $PI_WWW_DIR/
chown -R www-data:www-data $PI_WWW_DIR
find $PI_WWW_DIR -type d -exec chmod 750 {} \;
find $PI_WWW_DIR -type f -exec chmod 640 {} \;
rm -rf $PI_TEMP_DIR
systemctl restart infizity-backend.service
"@

ssh "$PI_USER@$PI_HOST" "$DEPLOY_COMMANDS"

# 6. Revert environment variables
Write-Host "Reverting environment variables to development values..."
Set-DevelopmentEnv

Write-Host "Deployment complete!" -ForegroundColor Green

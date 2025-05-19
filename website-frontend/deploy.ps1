$PI_USER = "pi"
$PI_HOST = "192.168.100.100"  # or your Pi's IP
$PI_PASSWORD = "amsterdam"   # Consider using SSH keys instead!
$BUILD_DIR = "./dist"           # Your build output folder
$PI_TEMP_DIR = "~/infizity_deploy"
$PI_WWW_DIR = "/var/www/infizity"
# 1. Build project
Write-Host "Building project..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# 2. Transfer files
Write-Host "Uploading files to Pi..."
scp -r "$BUILD_DIR" "${PI_USER}@${PI_HOST}:${PI_TEMP_DIR}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "SCP transfer failed!" -ForegroundColor Red
    exit 1
}

# 3. Execute remote deployment with PROPER PERMISSIONS
Write-Host "Running deployment on Pi..."
ssh "${PI_USER}@${PI_HOST}" @"
# Remove old files (as root)
sudo rm -rf "$PI_WWW_DIR"/*

# Copy new files (preserving www-data ownership)
sudo cp -r "$PI_TEMP_DIR"/* "$PI_WWW_DIR"/

# Fix permissions (www-data must own files)
sudo chown -R www-data:www-data "$PI_WWW_DIR"

# Set secure directory permissions (750 for dirs, 640 for files)
sudo find "$PI_WWW_DIR" -type d -exec chmod 750 {} \;
sudo find "$PI_WWW_DIR" -type f -exec chmod 640 {} \;

# Cleanup temp files
rm -rf "$PI_TEMP_DIR"
"@

Write-Host "Deployment complete!" -ForegroundColor Green
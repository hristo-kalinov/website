$PI_USER = "pi"
$PI_HOST = "192.168.100.100"  # or your Pi's IP
$PI_PASSWORD = "amsterdam"   # Consider using SSH keys instead!
$SOURCE_FILE = "./main.py"
$DEST_DIR = "~/website-backend"

# Transfer the file
Write-Host "Uploading main.py to Pi..."
scp "$SOURCE_FILE" "${PI_USER}@${PI_HOST}:${DEST_DIR}/main.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "File transfer failed!" -ForegroundColor Red
    exit 1
}

# Restart the service
Write-Host "Restarting infizity-api.service..."
ssh "${PI_USER}@${PI_HOST}" "sudo systemctl restart infizity-api.service"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Service restart failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment complete!" -ForegroundColor Green
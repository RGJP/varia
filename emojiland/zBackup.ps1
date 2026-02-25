# Configuration
$SevenZip = "C:\Program Files\7-Zip\7z.exe"
$BackupDir = "C:\Users\rapha\Desktop\DEV\backups"
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackupName = "Full_Sync_Backup.7z"
$FullBackupPath = Join-Path $BackupDir $BackupName

# Ensure 7-Zip exists
if (-not (Test-Path $SevenZip)) {
    Write-Error "7-Zip not found at $SevenZip."
    return
}

# Create backups dir if missing
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Set-Location $SourceDir

Write-Host "Monitoring $SourceDir. Backing up every 3 minutes..." -ForegroundColor Cyan

do {
    Write-Host "$(Get-Date): Syncing backup..." -ForegroundColor Yellow

    # 7-Zip Command:
    # -aoa: Overwrite All existing files (ensures the 7z is replaced/updated)
    # -xr!: EXCLUDE the backup destination folder (essential to prevent errors)
    & $SevenZip a -t7z -mx=0 -mmt=on -r -aoa "$FullBackupPath" * "-xr!$BackupDir"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "$(Get-Date): Backup updated successfully." -ForegroundColor Green
    } else {
        Write-Warning "$(Get-Date): 7-Zip encountered an issue (Code $LASTEXITCODE)."
    }

    Write-Host "Waiting 180 seconds..."
    Start-Sleep -Seconds 180
} while ($true)
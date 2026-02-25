# Configuration
$SevenZip = "C:\Program Files\7-Zip\7z.exe"
$BackupDir = "C:\Users\rapha\Desktop\DEV\backups"
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$MaxBackups = 5  
$IntervalSeconds = 600 # 10 minutes

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

Write-Host "MODE: Lightning Fast (Zero Compression)" -ForegroundColor Cyan
Write-Host "Keeping last $MaxBackups backups. Running every 10 mins..."

do {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmm"
    $BackupName = "Backup_$Timestamp.7z"
    $FullBackupPath = Join-Path $BackupDir $BackupName

    Write-Host "$(Get-Date): Instant Syncing..." -ForegroundColor Yellow

    # 7-Zip Command:
    # -mx=0: Store mode (No compression, maximum speed)
    # -mmt=on: Use all CPU threads
    & $SevenZip a -t7z -mx=0 -mmt=on -r -aoa "$FullBackupPath" * "-xr!$BackupDir"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Done!" -ForegroundColor Green
        
        # Rotation Logic: Keep only the 5 newest .7z files
        $OldBackups = Get-ChildItem -Path $BackupDir -Filter "*.7z" | Sort-Object CreationTime -Descending
        
        if ($OldBackups.Count -gt $MaxBackups) {
            $FilesToDelete = $OldBackups | Select-Object -Skip $MaxBackups
            $FilesToDelete | Remove-Item -Force
            Write-Host "Purged $($FilesToDelete.Count) old backup(s)." -ForegroundColor Gray
        }
    } else {
        Write-Warning "7-Zip Issue (Code $LASTEXITCODE)."
    }

    Write-Host "Sleeping for 10 minutes..."
    Start-Sleep -Seconds $IntervalSeconds
} while ($true)
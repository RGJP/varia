@echo off
setlocal

REM Ensure we're in the script's directory
cd /d "%~dp0"

REM Create backups dir if missing
if not exist "C:\Users\rapha\Desktop\DEV\backups" mkdir "C:\Users\rapha\Desktop\DEV\backups"

REM Fastest 7z: store mode (no compression), multi-threaded, recursive. Exclude .cmd files.
"C:\Program Files\7-Zip\7z.exe" a -t7z -mx=0 -mmt=on -r "C:\Users\rapha\Desktop\DEV\backups\%~n0_backup.7z" * -x!.cmd

if %errorlevel% equ 0 (
    echo Backup created successfully: %~n0_backup.7z
) else (
    echo Error during backup. Check 7-Zip path/install.
)

pause

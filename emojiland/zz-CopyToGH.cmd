@echo off
setlocal

REM === Paths ===
set SRC=C:\Users\rapha\Desktop\DEV\emojiland
set DST=C:\Users\rapha\Documents\GitHub\varia\emojiland

echo Deleting destination folder...
if exist "%DST%" (
    rmdir /s /q "%DST%"
)

echo Copying source folder to destination...
xcopy "%SRC%" "%DST%" /e /i /h /k /y

echo Done.
endlocal

C:\Users\rapha\AppData\Local\GitHubDesktop\GitHubDesktop.exe

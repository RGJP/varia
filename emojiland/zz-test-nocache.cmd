taskkill /F /IM brave.exe
timeout /t 1

start "" "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --incognito --disable-cache "http://localhost:8000/index.html"
python -m http.server 8000





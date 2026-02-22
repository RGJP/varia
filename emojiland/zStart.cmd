taskkill /F /IM chrome.exe /IM msedge.exe /IM firefox.exe /IM opera.exe /IM brave.exe
timeout /t 2 
cd C:\Users\rapha\Desktop\DEV\emojiland
start http://localhost:8000/index.html
python -m http.server
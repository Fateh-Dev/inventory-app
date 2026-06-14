Write-Host "Starting Backend (.NET Host)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Host; dotnet run"

Write-Host "Starting Frontend (Angular)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

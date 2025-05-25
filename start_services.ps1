# 启动后端服务
Start-Process powershell -ArgumentList "cd backend; python app.py"

# 等待2秒确保后端启动
Start-Sleep -Seconds 2

# 启动前端服务
Start-Process powershell -ArgumentList "cd frontend; npm start" 
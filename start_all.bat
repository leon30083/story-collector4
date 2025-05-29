@echo off
REM 启动后端
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
start cmd /k "python app.py"
cd ..

REM 启动前端
cd frontend
call npm install
call npm install axios
start cmd /k "npm start"
cd ..
echo =========================
echo 前后端已分别启动！
echo 后端: http://localhost:5000
echo 前端: http://localhost:3000
pause
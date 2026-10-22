@echo off
setlocal
cd /d "%~dp0"
if not exist ".env" (
  echo Chua co tep .env. Hay cau hinh DATABASE_URL truoc.
  pause
  exit /b 1
)
if not exist "node_modules\pg\package.json" (
  call npm.cmd ci
  if errorlevel 1 goto error
)
call npm.cmd run migrate
if errorlevel 1 goto error
call npm.cmd start
if errorlevel 1 goto error
exit /b 0
:error
echo Khong the khoi dong. Vui long gui thong bao loi, che mat khau neu co.
pause
exit /b 1

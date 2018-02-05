@echo off
SET ROOT_DIR=%~dp0\..
cd %ROOT_DIR%
call npm install
call npm run build
call npm start
pause


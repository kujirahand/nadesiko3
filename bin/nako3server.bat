@echo off
SET ROOT_DIR=%~dp0\..
cd %ROOT_DIR%
call npm run server
pause


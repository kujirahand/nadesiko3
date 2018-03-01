@echo off

rem --- set env for nadesiko3 ---
SET NAKO_HOME=%~dp0
SET PATH=%NAKO_HOME%bin;%NAKO_HOME%nodejs;%PATH%

rem --- cd here ---
cd %NAKO_HOME%

rem explorer "http://localhost:3030"
call npm run nako3edit:run

rem --- check error ---
IF "%ERRORLEVEL%"=="9009" (
  ECHO ------------------------------------
  ECHO [ERROR] Nadesiko3 packaging error
  ECHO ------------------------------------
  PAUSE
  EXIT
)


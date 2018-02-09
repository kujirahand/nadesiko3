@echo off

rem --- set env for nadesiko3 ---
SET NAKO_HOME=%~dp0
SET PATH=%NAKO_HOME%bin;%NAKO_HOME%nodejs;%PATH%

rem --- cd here ---
cd %NAKO_HOME%

rem --- check param ---
SET NAKO_MODE="server"

IF "%1" == "/cmd" (
  SET NAKO_MODE="cmd"
  ECHO start command mode
)
IF "%1" == "/test" (
  SET NAKO_MODE="cmd"
  ECHO start test
  call .\nodejs\npm test
)
IF "%1" == "/install" (
  SET NAKO_MODE="cmd"
  ECHO install files for windows
  call .\nodejs\node .\installer\setup-win.bat
)
IF %NAKO_MODE%=="server" (
  rem --- exec server ---
  call .\nodejs\npm run server
)

rem --- check error ---
IF "%ERRORLEVEL%"=="9009" (
  ECHO ------------------------------------
  ECHO [ERROR] Nadesiko3 packaging error
  ECHO ------------------------------------
  PAUSE
  EXIT
)


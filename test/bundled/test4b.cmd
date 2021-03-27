@echo off
setlocal
cd ../..

set BROWSER=FirefoxCustom
set HEADLESS=Headless

set SINGLEWATCH=--single-run

set TARGET_BASIC=
set TARGET_TURTLE=

FOR %%a IN (%*) DO (
  if "%%~a"=="ff" (set BROWSER=FirefoxCustom)
  if "%%~a"=="FF" (set BROWSER=FirefoxCustom)
  if "%%~a"=="ie" (set BROWSER=IE)
  if "%%~a"=="IE" (set BROWSER=IE)
  if "%%~a"=="edge" (set BROWSER=Edge)
  if "%%~a"=="Edge" (set BROWSER=Edge)
  if "%%~a"=="EDGE" (set BROWSER=Edge)
  if "%%~a"=="chrome" (set BROWSER=ChromeCustom)
  if "%%~a"=="Chrome" (set BROWSER=ChromeCustom)
  if "%%~a"=="CHROME" (set BROWSER=ChromeCustom)
  if "%%~a"=="hide" (set HEADLESS=Headless)
  if "%%~a"=="HIDE" (set HEADLESS=Headless)
  if "%%~a"=="view" (set HEADLESS=)
  if "%%~a"=="VIEW" (set HEADLESS=)
  if "%%~a"=="watch" (set SINGLEWATCH=--auto-watch)
  if "%%~a"=="WATCH" (set SINGLEWATCH=--auto-watch)
  if "%%~a"=="basic" (set TARGET_BASIC=YES)
  if "%%~a"=="BASIC" (set TARGET_BASIC=YES)
  if "%%~a"=="turtle" (set TARGET_TURTLE=YES)
  if "%%~a"=="TURTLE" (set TARGET_TURTLE=YES)
)

if "%BROWSER%"=="IE" (set HEADLESS=)

if "%TARGET_BASIC%%TARGET_TURTLE%"=="" (
  set TARGET_BASIC=YES
  set TARGET_TURTLE=
)


@echo on
if "%TARGET_BASIC%"=="YES" (
  call node_modules\.bin\cross-env TZ=Asia/Tokyo NODE_ENV=development node_modules\.bin\karma start %SINGLEWATCH% --browsers %BROWSER%%HEADLESS% --reporters=mocha test/bundled/karma.config.base.js
)
@echo on
if "%TARGET_TURTLE%"=="YES" (
  call node_modules\.bin\cross-env TZ=Asia/Tokyo NODE_ENV=development node_modules\.bin\karma start %SINGLEWATCH% --browsers %BROWSER%%HEADLESS% --reporters=mocha test_browsers/karma.config.turtle.js
)
endlocal

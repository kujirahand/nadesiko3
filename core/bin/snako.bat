@echo off

pushd %~dp0..
set ROOT_DIR=%CD%
popd

SET SRC_DIR=%ROOT_DIR%\command
SET CNAKO_JS=%SRC_DIR%\snako.mjs
if exist %ROOT_DIR%\nodejs\node.exe (
    SET NODE_EXE=%ROOT_DIR%\nodejs\node.exe
) else (
    SET NODE_EXE=node.exe
)

%NODE_EXE% %CNAKO_JS% %1 %2 %3 %4 %5 %6 %7 %8 %9

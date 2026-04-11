@echo off
title Kafemashini Print Agent
cd /d "%~dp0"
node dist\index.js
echo.
echo Print agent stopped. Press any key to close.
pause >nul

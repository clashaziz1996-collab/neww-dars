@echo off
title EduSchedule - Dars Jadvali Dasturi
echo ========================================================
echo   EduSchedule - Windows 11 Dars Jadvali Dasturi
echo ========================================================
echo Dastur ishga tushirilmoqda...

:: HTML faylining to'liq manzili
set "HTML_FILE=%~dp0index.html"

:: 1. Microsoft Edge orqali mustaqil dastur oynasi (App Mode) ko'rinishida ochish
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_FILE%" --window-size=1280,850
    goto :EOF
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_FILE%" --window-size=1280,850
    goto :EOF
)

:: 2. Google Chrome orqali mustaqil dastur oynasi ko'rinishida ochish
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_FILE%" --window-size=1280,850
    goto :EOF
)

:: 3. Standart brauzerda ochish
start "" "%HTML_FILE%"

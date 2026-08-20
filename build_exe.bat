@echo off
title EduSchedule - EXE Yaratuvchi (PyInstaller)
echo ========================================================
echo   EduSchedule - EXE Dasturini Yaratish (PyInstaller)
echo ========================================================
echo.

echo 1. PyInstaller kutubxonasi tekshirilmoqda va o'rnatilmoqda...
pip install pyinstaller

echo.
echo 2. EXE fayli yig'ilmoqda (Building Standalone EXE)...
pyinstaller --noconsole --onefile --add-data "index.html;." --add-data "style.css;." --add-data "app.js;." --name "EduSchedule_Dars_Jadvali" desktop_app.py

echo.
echo ========================================================
echo   Muvaffaqiyatli yakunlandi!
echo   Tayyor EXE fayl: dist\EduSchedule_Dars_Jadvali.exe
echo ========================================================
pause

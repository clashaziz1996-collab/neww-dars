@echo off
title EduSchedule - GitHubga Yuklash
echo ========================================================
echo   EduSchedule - GitHubga Avtomatik Yuklash Yordamchisi
echo ========================================================
echo.

:: Git mavjudligini tekshirish
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATOLIK] Kompyuteringizda Git o'rnatilmagan!
    echo Iltimos, avval https://git-scm.com/downloads saytidan Git dasturini o'rnating.
    echo.
    pause
    exit /b
)

echo 1. Git repozitoriysi sozlanmoqda...
git init
git add .
git commit -m "EduSchedule - Dars Jadvali Tizimi birinchi versiyasi"
git branch -M main

echo.
echo ========================================================
echo GitHub saytida (https://github.com/new) yangi repozitoriy yarating.
echo Keyin uning HTTPS havolasini bu yerga joylang (Paste qiling).
echo Masalan: https://github.com/foydalanuvchi_nomi/dars-jadvali.git
echo ========================================================
echo.
set /p REPO_URL="GitHub Repozitoriy havolasi (URL): "

if "%REPO_URL%"=="" (
    echo Havola kiritilmadi. Bekor qilindi.
    pause
    exit /b
)

git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo 2. Fayllar GitHubga yuklanmoqda (Push)...
git push -u origin main

echo.
echo ========================================================
echo   Tabriklaymiz! Loyiha GitHubga muvaffaqiyatli yuklandi!
echo ========================================================
pause

@echo off
REM IELTS Exam System - Quick Deploy Script (Windows)
REM This script helps you deploy to Vercel quickly

echo ================================
echo IELTS Exam System
echo Vercel Deployment Helper
echo ================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed. Please install Git first.
    echo Download from: https://git-scm.com
    pause
    exit /b 1
)

REM Check if this is a git repository
if not exist .git (
    echo [SETUP] Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit - IELTS Exam System"
    echo [SUCCESS] Git repository initialized
    echo.
)

REM Check if remote is set
git remote | findstr "origin" >nul
if errorlevel 1 (
    echo [WARNING] No remote repository found.
    echo.
    echo Please follow these steps:
    echo 1. Go to https://github.com/new
    echo 2. Create a new repository (don't add README, .gitignore, or license^)
    echo 3. Copy the repository URL
    echo 4. Run: git remote add origin YOUR_REPO_URL
    echo 5. Run: git push -u origin main
    echo.
    echo After that, you can deploy to Vercel:
    echo 1. Go to https://vercel.com/dashboard
    echo 2. Click 'Add New Project'
    echo 3. Import your GitHub repository
    echo 4. Follow the DEPLOYMENT_GUIDE.md for detailed instructions
    pause
    exit /b 0
)

REM Push to GitHub
echo [DEPLOY] Pushing to GitHub...
git add .
git commit -m "Prepare for Vercel deployment - %date% %time%"
git push

if errorlevel 0 (
    echo [SUCCESS] Successfully pushed to GitHub
    echo.
    echo Next steps:
    echo 1. Go to https://vercel.com/dashboard
    echo 2. Click 'Add New Project'
    echo 3. Import your GitHub repository
    echo 4. Follow the DEPLOYMENT_GUIDE.md for detailed instructions
    echo.
    echo See DEPLOYMENT_GUIDE.md for complete instructions
) else (
    echo [ERROR] Failed to push to GitHub
    echo Please check your remote repository and try again
)

pause

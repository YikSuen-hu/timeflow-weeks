@echo off
echo ==========================================
echo       TimeFlow Web App Auto-Deploy
echo ==========================================

echo [1/5] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

echo [2/5] ensuring .nojekyll exists...
if not exist docs\.nojekyll type nul > docs\.nojekyll

echo [3/5] Staging files...
git add .

echo [4/5] Committing changes...
set "timestamp=%date:/=-% %time::=-%"
git commit -m "Auto-deploy: %timestamp%"

echo [5/5] Pushing to GitHub (main)...
git push origin main --force

echo ==========================================
echo Deployment Success! 
echo Your site will update in 1-2 minutes.
echo URL: https://yiksuen-hu.github.io/timeflow-weeks/
echo ==========================================
pause

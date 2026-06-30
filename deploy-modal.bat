@echo off
REM Modal Labs deployment script for face-processing-service (Windows)

echo ==============================================
echo   Face Processing Service - Modal Deployment
echo ==============================================
echo.

REM Check if modal CLI is installed
where modal >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Modal CLI not found. Installing...
    pip install modal
    echo.
)

REM Check if authenticated
echo [*] Checking authentication...
modal token list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Not authenticated. Running authentication...
    modal token new
    echo.
) else (
    echo [+] Already authenticated
    echo.
)

REM Check if secrets exist
echo [*] Checking secrets...
modal secret list 2>nul | findstr /C:"face-processing-secrets" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Secrets 'face-processing-secrets' not found.
    echo.
    echo You need to create them first with this command:
    echo.
    echo modal secret create face-processing-secrets ^
    echo   MONGO_URI="your_mongodb_uri" ^
    echo   R2_ACCOUNT_ID="your_account_id" ^
    echo   R2_ACCESS_KEY_ID="your_r2_access_key" ^
    echo   R2_SECRET_ACCESS_KEY="your_r2_secret" ^
    echo   R2_BUCKET="saylani-moments" ^
    echo   QDRANT_URL="https://xxxxx.qdrant.io" ^
    echo   QDRANT_API_KEY="your_qdrant_api_key"
    echo.
    echo Get credentials from:
    echo   - MongoDB: MongoDB Atlas dashboard
    echo   - R2: Cloudflare R2 dashboard -^> API Tokens
    echo   - Qdrant: Qdrant Cloud dashboard -^> API Keys
    echo.
    pause
    exit /b 1
) else (
    echo [+] Secrets found
    echo.
)

REM Deploy
echo [*] Deploying Modal app (this may take 2-3 minutes on first deploy)...
echo.
modal deploy modal_app.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================
    echo [+] Deployment complete!
    echo ==============================================
    echo.
    echo Next steps:
    echo 1. Copy the function URLs from above
    echo 2. Add to backend\.env:
    echo    MODAL_FUNCTION_URL=https://your-username--face-processing-service-detect-faces.modal.run
    echo.
    echo 3. Generate webhook secret:
    echo    node -e "console.log(require('crypto'^).randomBytes(32^).toString('hex'^)^)"
    echo.
    echo 4. Add webhook secret to backend\.env:
    echo    MODAL_WEBHOOK_SECRET=your_generated_secret
    echo.
    pause
) else (
    echo.
    echo [!] Deployment failed. Check the error messages above.
    pause
    exit /b 1
)

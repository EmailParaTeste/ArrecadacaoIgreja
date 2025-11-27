@echo off
echo ========================================
echo   Gerador de APK - I.M.I.F
echo ========================================
echo.

echo [1/4] Verificando EAS CLI...
call eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo EAS CLI nao encontrado. Instalando...
    call npm install -g eas-cli
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar EAS CLI
        pause
        exit /b 1
    )
)
echo EAS CLI instalado!
echo.

echo [2/4] Fazendo login no Expo...
echo Por favor, faca login com sua conta Expo
call eas login
if %errorlevel% neq 0 (
    echo ERRO: Falha no login
    pause
    exit /b 1
)
echo.

echo [3/4] Configurando projeto...
call eas build:configure
echo.

echo [4/4] Iniciando build do APK...
echo Isso pode levar 10-20 minutos...
call eas build --platform android --profile preview
echo.

echo ========================================
echo   Build concluido!
echo ========================================
echo.
echo O link para download do APK foi exibido acima.
echo Voce tambem pode acessar em: https://expo.dev/accounts/[seu-usuario]/projects/imif-app/builds
echo.
pause

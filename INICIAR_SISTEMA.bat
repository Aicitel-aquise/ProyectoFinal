@echo off
title SINDICATO DE MINIBUSES - Sistema INS-600
color 0A

echo.
echo ====================================================
echo    SINDICATO DE MINIBUSES - SISTEMA DE GESTION
echo    Examen INS-600 - Leticia Aquise Taco
echo    Propuesta 15
echo ====================================================
echo.

echo Limpiando procesos previos...
taskkill /f /im dotnet.exe /im SindicatoMinibusesAPI.exe /im cloudflared.exe >nul 2>&1
if exist "%~dp0tunnel_output.log" del /f /q "%~dp0tunnel_output.log" >nul 2>&1
timeout /t 2 /nobreak >nul

cd /d "%~dp0SindicatoMinibusesAPI"

echo [1/3] Iniciando Backend API .NET...
start /B dotnet run --profile http >nul 2>&1

echo Esperando que la API inicie...
:esperar_api
timeout /t 3 /nobreak >nul
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5136/swagger' -UseBasicParsing -TimeoutSec 3 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo    Todavia cargando...
    goto esperar_api
)

echo.
echo [OK] API funcionando en http://localhost:5136
echo [OK] Swagger en http://localhost:5136/swagger
echo [OK] Frontend en http://localhost:5136/index.html
echo.

start http://localhost:5136/index.html

echo [2/3] Iniciando tunel Cloudflare...

set "CF=C:\Program Files (x86)\cloudflared\cloudflared.exe"
if not exist "%CF%" (
    set "CF=%~dp0cloudflared.exe"
)
if not exist "%CF%" (
    echo [AVISO] cloudflared no encontrado.
    echo El sistema funciona en: http://localhost:5136/index.html
    echo.
    goto mantener
)

echo Generando URL publica...
start /B "" "%CF%" tunnel --url http://localhost:5136 2>"%~dp0tunnel_output.log"

:esperar_tunnel
timeout /t 3 /nobreak >nul
findstr /C:"trycloudflare.com" "%~dp0tunnel_output.log" >nul 2>&1
if errorlevel 1 (
    echo    Conectando al tunel...
    goto esperar_tunnel
)

echo.
echo [3/3] TUNEL ACTIVO
echo.
echo ====================================================
echo    URL PUBLICA PARA EL DOCENTE:
echo ====================================================
echo.
powershell -Command "$l=Get-Content '%~dp0tunnel_output.log';foreach($x in $l){if($x -match 'https://[a-z0-9-]+\.trycloudflare\.com'){Write-Host $matches[0];Write-Host ($matches[0] + '/index.html');break}}"
echo.
echo ====================================================
echo    Comparta cualquiera de esos links con el docente.
echo    El puede abrirlo desde su celular o cualquier PC.
echo.
echo    Usuarios:
echo    Honorato Ticona / secretario123  (Secretario)
echo    Irma Calle / controlador123      (Controlador)
echo ====================================================

:mantener
echo.
echo NO CIERRE ESTA VENTANA. El sistema se detiene si la cierra.
pause >nul

@echo off
chcp 65001 >nul
title Biazotto Gestao de Viagens e Milhas - Servidor CMS
cd /d "%~dp0"

echo ====================================================================
echo    Iniciando Servidor Biazotto (Site Institucional + Painel CMS)
echo    Versao Portatil com Node.js Embutido (Zero Instalacao Necessaria)
echo ====================================================================
echo.

set "NODE_EXE=%~dp0bin\node.exe"

if exist "%NODE_EXE%" (
    echo [OK] Usando Node.js portatil embutido.
    goto RUN
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    set "NODE_EXE=node"
    echo [OK] Usando Node.js do sistema operacional.
    goto RUN
)

echo [ERRO] Node.js nao encontrado em bin\node.exe nem no sistema!
echo Por favor instale o Node.js v22 ou superior em: https://nodejs.org/
pause
exit /b

:RUN
echo [OK] Servidor iniciando...
echo [INFO] O navegador sera aberto automaticamente com o endereco correto.
echo [INFO] Pressione Ctrl + C neste terminal para encerrar o servidor.
echo.
"%NODE_EXE%" server/index.js
pause
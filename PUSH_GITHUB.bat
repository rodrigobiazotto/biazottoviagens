@echo off
chcp 65001 >nul
title Biazotto - Enviar para GitHub
cd /d "%~dp0"

echo ====================================================================
echo    Enviando projeto Biazotto Viagens para o GitHub
echo    Destino: https://github.com/rodrigobiazotto/biazottoviagens.git
echo ====================================================================
echo.

git push -u origin main

echo.
echo Concluido!
pause

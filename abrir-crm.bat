@echo off
REM Abre o CRM Solar em http://localhost:8080
REM Deixe esta janela ABERTA enquanto usar o sistema: fechando ela, o servidor para.

cd /d "%~dp0crm"

if not exist "index.html" (
  echo.
  echo  ERRO: nao achei o index.html em %cd%
  echo  Este arquivo precisa estar na pasta C:\Solarbot\chatbot
  echo.
  pause
  exit /b 1
)

where python >/dev/null 2>nul
if errorlevel 1 (
  echo.
  echo  ERRO: Python nao encontrado.
  echo  Instale em https://python.org e marque "Add to PATH".
  echo.
  pause
  exit /b 1
)

echo.
echo  ============================================
echo   CRM Solar rodando
echo.
echo   Abra no navegador:  http://localhost:8080
echo.
echo   NAO FECHE esta janela enquanto usar o CRM.
echo   Para parar: feche a janela ou aperte Ctrl+C.
echo  ============================================
echo.

start "" http://localhost:8080
python -m http.server 8080

@echo off
REM Abre a pagina de teste do chatbot em http://localhost:8000/test-chatbot.html
REM Deixe esta janela ABERTA: fechando ela, o servidor para.

cd /d "%~dp0"

if not exist "test-chatbot.html" (
  echo.
  echo  ERRO: nao achei o test-chatbot.html em %cd%
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
echo   Chatbot rodando
echo.
echo   Abra no navegador:
echo   http://localhost:8000/test-chatbot.html
echo.
echo   NAO FECHE esta janela.
echo  ============================================
echo.

start "" http://localhost:8000/test-chatbot.html
python -m http.server 8000

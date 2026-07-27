@echo off
REM ═══════════════════════════════════════════════════════════════════════
REM  Servidor local do site Instituto ARIA
REM  ---------------------------------------------------------------------
REM  Da um duplo-clique neste arquivo pra abrir o site em http://localhost:8000
REM  em vez de file://. Isso faz o fetch() do spa-nav.js funcionar de verdade,
REM  entao a transicao suave entre paginas e a queda unica do cipo funcionam
REM  igual ao site publicado no GitHub Pages.
REM
REM  Pra parar o servidor: feche esta janela (ou Ctrl+C).
REM ═══════════════════════════════════════════════════════════════════════

cd /d "%~dp0"

echo Procurando Python instalado...

where python >nul 2>nul
if %errorlevel%==0 (
    echo Iniciando servidor com "python"...
    start "" http://localhost:8000/index.html
    python -m http.server 8000
    goto :fim
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo Iniciando servidor com "py"...
    start "" http://localhost:8000/index.html
    py -m http.server 8000
    goto :fim
)

where npx >nul 2>nul
if %errorlevel%==0 (
    echo Python nao encontrado. Iniciando servidor com "npx serve"...
    start "" http://localhost:3000/index.html
    npx --yes serve -l 3000 .
    goto :fim
)

echo.
echo Nao encontrei Python nem Node/npx instalados nesta maquina.
echo Instale um dos dois para rodar o servidor local:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
pause

:fim

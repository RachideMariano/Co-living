@echo off
REM Abre a build estática em http://127.0.0.1:5173/
cd /d "%~dp0"
REM Se existir Node, usa http-server via npx; caso contrário tenta Python.
where node >nul 2>&1
if %ERRORLEVEL%==0 (
  start "Coliving - servidor" cmd /k "npx --yes http-server dist -p 5173"
  @echo off
  REM Abre a build estática em http://127.0.0.1:5173/
  cd /d "%~dp0"

  REM Tenta detectar Node
  where node >nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    start "Coliving - servidor" cmd /c "npx --yes http-server dist -p 5173"
    goto open
  )

  REM Tenta detectar Python
  where python >nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    start "Coliving - servidor" cmd /c "python -m http.server 5173 --directory dist"
    goto open
  )

  echo Nem Node.js nem Python foram encontrados neste sistema.
  echo Instale Node https://nodejs.org ou Python https://python.org e tente novamente.
  pause
  exit /b 1

  :open
  timeout /t 1 >nul
  start "" "http://127.0.0.1:5173/"
  exit /b 0

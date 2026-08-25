@echo off
REM Atlas AI - Start Web Interface (Windows)

echo Starting Atlas AI Web Interface...
echo Open http://localhost:3000 in your browser

cd web
call npm install
call npm run dev

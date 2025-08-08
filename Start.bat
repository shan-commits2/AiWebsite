@echo off
title Starting Dev Server...

echo Running npm run dev...
start cmd /k "npm run dev"

echo Waiting for server to start...
timeout /t 5 >nul

echo Opening browser at http://localhost:5000
start http://localhost:5000

exit

@echo off

wt ^
  new-tab --title "Frontend" cmd /k "cd /d C:\NextStep\frontend && npm start" ^
  ; new-tab --title "Backend" cmd /k "cd /d C:\NextStep\backend && node server.js"

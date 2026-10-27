@echo off
echo ========================================================
echo Mempersiapkan ZIP Bersih untuk Build di MacBook...
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dest = '..\palti-fx-ios-ready.zip'; " ^
  "if (Test-Path $dest) { Remove-Item $dest -Force }; " ^
  "$items = Get-ChildItem -Path . -Exclude 'node_modules', '.expo', '.git', 'android', 'releases', 'landing-page.zip', 'dist', '.next'; " ^
  "Compress-Archive -Path $items -DestinationPath $dest; " ^
  "Write-Host 'SELESAI! File ZIP berhasil dibuat di:' (Resolve-Path $dest)"

echo.
pause

Write-Host "Installing codemax..." -ForegroundColor Cyan

try {
  npm install -g codemax
  Write-Host "`n✓ codemax installed!" -ForegroundColor Green
  Write-Host "Run 'codemax' to start" -ForegroundColor Green
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
  exit 1
}

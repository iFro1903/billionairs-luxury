# BILLIONAIRS - Quick Start für Produktion
# PowerShell Script für Windows

Write-Host "🎩 BILLIONAIRS Payment System - Production Setup" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# 1. Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env Datei nicht gefunden!" -ForegroundColor Red
    Write-Host "   Bitte erstellen Sie .env basierend auf .env.example" -ForegroundColor Yellow
    Write-Host "   und fügen Sie Ihre Stripe Live-Keys ein.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env Datei gefunden`n" -ForegroundColor Green

# 2. Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installiere Dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installiert`n" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies bereits installiert`n" -ForegroundColor Green
}

# 3. Environment auswählen
Write-Host "🌍 Wählen Sie die Umgebung:" -ForegroundColor Cyan
Write-Host "   1) Development (Test-Keys)" -ForegroundColor White
Write-Host "   2) Production (Live-Keys) ⚡" -ForegroundColor Yellow
$choice = Read-Host "`nIhre Wahl (1 oder 2)"

if ($choice -eq "2") {
    Write-Host "`n⚠️  PRODUCTION MODE AKTIVIERT!" -ForegroundColor Red
    Write-Host "   - Live Stripe Keys werden verwendet" -ForegroundColor Yellow
    Write-Host "   - Echte Zahlungen werden verarbeitet" -ForegroundColor Yellow
    Write-Host "   - Alle Transaktionen sind real!`n" -ForegroundColor Yellow
    
    $confirm = Read-Host "Sind Sie sicher? (ja/nein)"
    if ($confirm -ne "ja") {
        Write-Host "`n❌ Abgebrochen." -ForegroundColor Red
        exit 0
    }
    
    # Set environment to production
    $env:NODE_ENV = "production"
    Write-Host "`n🚀 Starte PRODUCTION Server...`n" -ForegroundColor Green
    npm run start:production
    
} else {
    Write-Host "`n🧪 DEVELOPMENT MODE AKTIVIERT" -ForegroundColor Green
    Write-Host "   - Test Stripe Keys werden verwendet" -ForegroundColor Cyan
    Write-Host "   - Keine echten Zahlungen`n" -ForegroundColor Cyan
    
    $env:NODE_ENV = "development"
    Write-Host "🚀 Starte DEVELOPMENT Server...`n" -ForegroundColor Green
    npm run dev
}

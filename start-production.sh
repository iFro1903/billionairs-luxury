#!/bin/bash
# BILLIONAIRS - Quick Start für Produktion
# Bash Script für Linux/Mac

echo "🎩 BILLIONAIRS Payment System - Production Setup"
echo "================================================"
echo ""

# 1. Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env Datei nicht gefunden!"
    echo "   Bitte erstellen Sie .env basierend auf .env.example"
    echo "   und fügen Sie Ihre Stripe Live-Keys ein."
    echo ""
    exit 1
fi

echo "✅ .env Datei gefunden"
echo ""

# 2. Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installiere Dependencies..."
    npm install
    echo "✅ Dependencies installiert"
    echo ""
else
    echo "✅ Dependencies bereits installiert"
    echo ""
fi

# 3. Environment auswählen
echo "🌍 Wählen Sie die Umgebung:"
echo "   1) Development (Test-Keys)"
echo "   2) Production (Live-Keys) ⚡"
read -p "Ihre Wahl (1 oder 2): " choice

if [ "$choice" = "2" ]; then
    echo ""
    echo "⚠️  PRODUCTION MODE AKTIVIERT!"
    echo "   - Live Stripe Keys werden verwendet"
    echo "   - Echte Zahlungen werden verarbeitet"
    echo "   - Alle Transaktionen sind real!"
    echo ""
    
    read -p "Sind Sie sicher? (ja/nein): " confirm
    if [ "$confirm" != "ja" ]; then
        echo ""
        echo "❌ Abgebrochen."
        exit 0
    fi
    
    # Set environment to production
    export NODE_ENV=production
    echo ""
    echo "🚀 Starte PRODUCTION Server..."
    echo ""
    npm run start:production
    
else
    echo ""
    echo "🧪 DEVELOPMENT MODE AKTIVIERT"
    echo "   - Test Stripe Keys werden verwendet"
    echo "   - Keine echten Zahlungen"
    echo ""
    
    export NODE_ENV=development
    echo "🚀 Starte DEVELOPMENT Server..."
    echo ""
    npm run dev
fi

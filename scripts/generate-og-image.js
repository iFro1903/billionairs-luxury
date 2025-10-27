/**
 * OG Image Generator Script
 * Erstellt automatisch einen Screenshot der og-image.html und speichert ihn als PNG
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function generateOGImage() {
  console.log('🎨 Starte OG Image Generierung...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Setze Viewport auf exakt 1200x630px (Standard OG Image Größe)
  await page.setViewportSize({ width: 1200, height: 630 });

  // Pfad zur og-image.html
  const htmlPath = path.resolve(__dirname, '../assets/images/og-image.html');
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;

  console.log(`📄 Lade HTML: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Warte kurz für Animationen
  await page.waitForTimeout(2000);

  // Screenshot speichern
  const outputPath = path.resolve(__dirname, '../assets/images/og-image.png');
  
  console.log(`📸 Erstelle Screenshot...`);
  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false
  });

  await browser.close();

  // Prüfe ob Datei existiert
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`\n✅ OG Image erfolgreich erstellt!`);
    console.log(`📁 Speicherort: ${outputPath}`);
    console.log(`📏 Dateigröße: ${fileSizeKB} KB`);
    console.log(`🎯 Größe: 1200x630px`);
    console.log(`\n🚀 Bereit für Social Media Sharing!`);
  } else {
    console.error('❌ Fehler: Datei wurde nicht erstellt');
    process.exit(1);
  }
}

generateOGImage().catch(error => {
  console.error('❌ Fehler beim Generieren des OG Images:', error);
  process.exit(1);
});

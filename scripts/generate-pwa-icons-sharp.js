#!/usr/bin/env node

/**
 * Generate PWA Icons for BILLIONAIRS LUXURY (SVG to PNG)
 * Requires: Sharp library for image processing
 * 
 * Usage: npm install sharp --save-dev && node scripts/generate-pwa-icons-sharp.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.log('📦 Installing sharp for image processing...');
    console.log('Run: npm install sharp --save-dev');
    console.log('\nThen run: node scripts/generate-pwa-icons-sharp.js');
    process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, '..', 'icons');
const svgPath = path.join(iconDir, 'icon-base.svg');

// Create SVG template
const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0C0C0C"/>
  <rect x="50" y="50" width="412" height="412" rx="75" ry="75" 
        fill="none" stroke="#E8B4A0" stroke-width="8" 
        filter="url(#glow)"/>
  <text x="256" y="300" font-family="Playfair Display, Georgia, serif" 
        font-size="280" font-weight="bold" fill="#E8B4A0" 
        text-anchor="middle" letter-spacing="-10">B</text>
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>`;

async function generateIcons() {
    console.log('🎨 Generating PWA Icons for BILLIONAIRS LUXURY...\n');

    for (const size of sizes) {
        const svg = svgTemplate.replace('SIZE', size).replace('SIZE', size);
        const outputPath = path.join(iconDir, `icon-${size}x${size}.png`);

        try {
            await sharp(Buffer.from(svg))
                .resize(size, size)
                .png()
                .toFile(outputPath);
            
            console.log(`✅ Generated icon-${size}x${size}.png`);
        } catch (error) {
            console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
        }
    }

    console.log('\n🎉 All PWA icons generated successfully!');
    console.log(`📁 Location: ${iconDir}\n`);
}

generateIcons().catch(console.error);

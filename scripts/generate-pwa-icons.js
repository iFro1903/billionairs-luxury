const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Generate PWA Icons for BILLIONAIRS LUXURY
 * Creates 8 icon sizes in PNG format
 */

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, '..', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
}

// Rose gold color palette
const colors = {
    background: '#0C0C0C', // Dark obsidian
    gold: '#E8B4A0',       // Rose gold primary
    accent: '#D4A574'      // Rose gold secondary
};

sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, size, size);

    // Gold border (rounded rectangle)
    const borderWidth = Math.max(2, size * 0.04);
    const cornerRadius = size * 0.15;
    const padding = size * 0.1;

    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = borderWidth;
    ctx.beginPath();
    ctx.roundRect(
        padding,
        padding,
        size - padding * 2,
        size - padding * 2,
        cornerRadius
    );
    ctx.stroke();

    // Inner glow
    ctx.shadowColor = colors.gold;
    ctx.shadowBlur = size * 0.05;
    ctx.stroke();

    // Text "B" for BILLIONAIRS
    ctx.shadowBlur = 0;
    ctx.fillStyle = colors.gold;
    ctx.font = `bold ${size * 0.5}px "Playfair Display", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', size / 2, size / 2);

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    const filename = `icon-${size}x${size}.png`;
    fs.writeFileSync(path.join(iconDir, filename), buffer);
    console.log(`✅ Generated ${filename}`);
});

console.log('\n🎉 All PWA icons generated successfully!');
console.log(`📁 Location: ${iconDir}\n`);

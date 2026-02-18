#!/usr/bin/env node
/**
 * In-Place Minification Script
 * 
 * Minifies all CSS and JS files in assets/ directory IN-PLACE.
 * - CSS: Removes comments, whitespace, newlines
 * - JS: Uses terser for safe minification
 * 
 * NO HTML files are modified. NO file paths change.
 * All pages automatically load the smaller files.
 * 
 * Revert with: git checkout -- assets/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CSS_DIR = path.join(__dirname, 'assets', 'css');
const JS_DIR = path.join(__dirname, 'assets', 'js');

// Simple but safe CSS minification
function minifyCSS(content) {
    let result = content;
    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments (only those at start of line or after semicolon)
    // Be careful not to remove url() contents
    result = result.replace(/^\s*\/\/.*$/gm, '');
    // Collapse whitespace
    result = result.replace(/\s+/g, ' ');
    // Remove spaces around structural chars
    result = result.replace(/\s*{\s*/g, '{');
    result = result.replace(/\s*}\s*/g, '}');
    result = result.replace(/\s*;\s*/g, ';');
    result = result.replace(/\s*:\s*/g, ':');
    result = result.replace(/\s*,\s*/g, ',');
    // Remove trailing semicolons before closing braces
    result = result.replace(/;}/g, '}');
    // Remove leading/trailing whitespace
    result = result.trim();
    return result;
}

// Stats tracking
let totalOriginalCSS = 0;
let totalMinifiedCSS = 0;
let totalOriginalJS = 0;
let totalMinifiedJS = 0;
let cssCount = 0;
let jsCount = 0;
let skipped = [];

console.log('=== In-Place Minification ===\n');

// --- MINIFY CSS ---
console.log('--- CSS Minification ---');
const cssFiles = fs.readdirSync(CSS_DIR).filter(f => f.endsWith('.css'));

for (const file of cssFiles) {
    const filePath = path.join(CSS_DIR, file);
    const original = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(original, 'utf8');
    
    // Skip already minified files (very little whitespace ratio)
    const whitespaceRatio = (original.match(/\s/g) || []).length / original.length;
    if (whitespaceRatio < 0.05 && originalSize > 100) {
        console.log(`  SKIP ${file} (already minified)`);
        skipped.push(file);
        continue;
    }
    
    const minified = minifyCSS(original);
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const saving = originalSize - minifiedSize;
    const percent = originalSize > 0 ? Math.round((saving / originalSize) * 100) : 0;
    
    // Safety check: minified should be at least 30% of original
    if (minifiedSize < originalSize * 0.3) {
        console.log(`  WARN ${file}: minified too small (${percent}% reduction), SKIPPING for safety`);
        skipped.push(file);
        continue;
    }
    
    fs.writeFileSync(filePath, minified, 'utf8');
    totalOriginalCSS += originalSize;
    totalMinifiedCSS += minifiedSize;
    cssCount++;
    console.log(`  ✓ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(minifiedSize/1024).toFixed(1)}KB (-${percent}%)`);
}

// --- MINIFY JS ---
console.log('\n--- JS Minification ---');
const jsFiles = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));

for (const file of jsFiles) {
    const filePath = path.join(JS_DIR, file);
    const original = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(original, 'utf8');
    
    // Skip already minified files
    const whitespaceRatio = (original.match(/\s/g) || []).length / original.length;
    if (whitespaceRatio < 0.05 && originalSize > 100) {
        console.log(`  SKIP ${file} (already minified)`);
        skipped.push(file);
        continue;
    }
    
    // Use terser for JS minification (safe, preserves functionality)
    const tmpIn = path.join(__dirname, '_tmp_input.js');
    const tmpOut = path.join(__dirname, '_tmp_output.js');
    
    try {
        fs.writeFileSync(tmpIn, original, 'utf8');
        execSync(`npx terser "${tmpIn}" -o "${tmpOut}" --compress --mangle --comments false`, {
            cwd: __dirname,
            stdio: 'pipe'
        });
        
        const minified = fs.readFileSync(tmpOut, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const saving = originalSize - minifiedSize;
        const percent = originalSize > 0 ? Math.round((saving / originalSize) * 100) : 0;
        
        // Safety check
        if (minifiedSize < originalSize * 0.15) {
            console.log(`  WARN ${file}: terser output too small (${percent}% reduction), SKIPPING`);
            skipped.push(file);
            continue;
        }
        
        fs.writeFileSync(filePath, minified, 'utf8');
        totalOriginalJS += originalSize;
        totalMinifiedJS += minifiedSize;
        jsCount++;
        console.log(`  ✓ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(minifiedSize/1024).toFixed(1)}KB (-${percent}%)`);
    } catch (err) {
        console.log(`  ERROR ${file}: ${err.message.split('\n')[0]} - SKIPPING`);
        skipped.push(file);
    }
    
    // Cleanup temp files
    try { fs.unlinkSync(tmpIn); } catch(e) {}
    try { fs.unlinkSync(tmpOut); } catch(e) {}
}

// --- SUMMARY ---
const totalOriginal = totalOriginalCSS + totalOriginalJS;
const totalMinified = totalMinifiedCSS + totalMinifiedJS;
const totalSaving = totalOriginal - totalMinified;

console.log('\n=== SUMMARY ===');
console.log(`CSS: ${cssCount} files, ${(totalOriginalCSS/1024).toFixed(1)}KB → ${(totalMinifiedCSS/1024).toFixed(1)}KB`);
console.log(`JS:  ${jsCount} files, ${(totalOriginalJS/1024).toFixed(1)}KB → ${(totalMinifiedJS/1024).toFixed(1)}KB`);
console.log(`Total: ${(totalOriginal/1024).toFixed(1)}KB → ${(totalMinified/1024).toFixed(1)}KB (-${Math.round((totalSaving/totalOriginal)*100)}%)`);
console.log(`Saved: ${(totalSaving/1024).toFixed(1)}KB`);
if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.length} files (${skipped.join(', ')})`);
}
console.log('\nTo revert: git checkout -- assets/');

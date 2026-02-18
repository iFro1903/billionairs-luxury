/**
 * BILLIONAIRS Asset Bundler
 * Combines and minifies all CSS and JS files into bundles.
 * Run: node build-bundles.js
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// ──────────────────────────────────────────────
// CSS FILES (in load order from index.html)
// ──────────────────────────────────────────────
const cssFiles = [
    'assets/css/cookie-consent.css',
    'assets/css/toast.css',
    'assets/css/mobile-performance-light.css',
    'assets/css/styles.css',
    'assets/css/mobile-nav.css',
    'assets/css/testimonials.css',
    'assets/css/member-comments.css',
    'assets/css/benefits.css',
    'assets/css/payment-methods.css',
    'assets/css/language-dropdown.css',
    'assets/css/mobile-language-dropdown.css',
    'assets/css/faq-footer.css',
    'assets/css/what-isnt.css',
    'assets/css/last-few-days.css',
    'assets/css/the-truth.css',
    'assets/css/language-selector.css',
];

// ──────────────────────────────────────────────
// JS FILES — Split into 3 bundles by purpose
// ──────────────────────────────────────────────

// Bundle 1: Core (early-load, non-deferred)
const jsCoreFiles = [
    'assets/js/toast.js',
    'assets/js/cookie-consent.js',
];

// Bundle 2: i18n + Language
const jsI18nFiles = [
    'assets/js/i18n.js',
    'assets/js/lang-dropdown-simple.js',
    'assets/js/modal-i18n.js',
    'assets/js/page-i18n.js',
    'assets/js/payment-i18n.js',
];

// Bundle 3: Features (all deferred scripts)
const jsFeatureFiles = [
    'assets/js/mobile-performance-light.js',
    'assets/js/sw-update.js',
    'assets/js/accessibility.js',
    'assets/js/background-sync.js',
    'assets/js/push-notifications.js',
    'assets/js/notifications.js',
    'assets/js/main.js',
    'assets/js/faq.js',
    'assets/js/testimonials.js',
    'assets/js/stripe-payment.js',
    'assets/js/payment-methods-new.js',
    'assets/js/benefits.js',
];

// ──────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────

function readAndConcat(files, label) {
    let combined = '';
    let count = 0;
    for (const file of files) {
        const fullPath = path.join(__dirname, file);
        if (!fs.existsSync(fullPath)) {
            console.warn(`  ⚠ SKIP (not found): ${file}`);
            continue;
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        combined += `\n/* === ${path.basename(file)} === */\n` + content + '\n';
        count++;
    }
    console.log(`  ✓ ${count}/${files.length} files combined for ${label}`);
    return combined;
}

function minifyCSS(css) {
    // Simple but effective CSS minification
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '')      // Remove comments
        .replace(/\s+/g, ' ')                   // Collapse whitespace
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')   // Remove spaces around selectors
        .replace(/;}/g, '}')                     // Remove last semicolons
        .replace(/^\s+|\s+$/g, '')               // Trim
        .trim();
}

// ──────────────────────────────────────────────
// BUILD
// ──────────────────────────────────────────────

async function build() {
    console.log('\n🔨 BILLIONAIRS Asset Bundler\n');
    const distDir = path.join(__dirname, 'assets', 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    // ── CSS Bundle ──
    console.log('📦 Building CSS bundle...');
    const cssRaw = readAndConcat(cssFiles, 'CSS');
    const cssMin = minifyCSS(cssRaw);
    const cssSizeBefore = Buffer.byteLength(cssRaw, 'utf8');
    const cssSizeAfter = Buffer.byteLength(cssMin, 'utf8');
    fs.writeFileSync(path.join(distDir, 'styles.bundle.css'), cssMin);
    console.log(`  ✓ CSS: ${(cssSizeBefore/1024).toFixed(0)}KB → ${(cssSizeAfter/1024).toFixed(0)}KB (${Math.round((1 - cssSizeAfter/cssSizeBefore) * 100)}% smaller)\n`);

    // ── JS Core Bundle ──
    console.log('📦 Building JS Core bundle...');
    const jsCoreRaw = readAndConcat(jsCoreFiles, 'JS Core');
    const jsCoreMin = await minify(jsCoreRaw, { compress: true, mangle: true });
    const jsCoreSizeBefore = Buffer.byteLength(jsCoreRaw, 'utf8');
    const jsCoreSizeAfter = Buffer.byteLength(jsCoreMin.code, 'utf8');
    fs.writeFileSync(path.join(distDir, 'core.bundle.js'), jsCoreMin.code);
    console.log(`  ✓ JS Core: ${(jsCoreSizeBefore/1024).toFixed(0)}KB → ${(jsCoreSizeAfter/1024).toFixed(0)}KB (${Math.round((1 - jsCoreSizeAfter/jsCoreSizeBefore) * 100)}% smaller)\n`);

    // ── JS i18n Bundle ──
    console.log('📦 Building JS i18n bundle...');
    const jsI18nRaw = readAndConcat(jsI18nFiles, 'JS i18n');
    const jsI18nMin = await minify(jsI18nRaw, { compress: true, mangle: true });
    const jsI18nSizeBefore = Buffer.byteLength(jsI18nRaw, 'utf8');
    const jsI18nSizeAfter = Buffer.byteLength(jsI18nMin.code, 'utf8');
    fs.writeFileSync(path.join(distDir, 'i18n.bundle.js'), jsI18nMin.code);
    console.log(`  ✓ JS i18n: ${(jsI18nSizeBefore/1024).toFixed(0)}KB → ${(jsI18nSizeAfter/1024).toFixed(0)}KB (${Math.round((1 - jsI18nSizeAfter/jsI18nSizeBefore) * 100)}% smaller)\n`);

    // ── JS Features Bundle ──
    console.log('📦 Building JS Features bundle...');
    const jsFeatRaw = readAndConcat(jsFeatureFiles, 'JS Features');
    const jsFeatMin = await minify(jsFeatRaw, { compress: true, mangle: true });
    const jsFeatSizeBefore = Buffer.byteLength(jsFeatRaw, 'utf8');
    const jsFeatSizeAfter = Buffer.byteLength(jsFeatMin.code, 'utf8');
    fs.writeFileSync(path.join(distDir, 'features.bundle.js'), jsFeatMin.code);
    console.log(`  ✓ JS Features: ${(jsFeatSizeBefore/1024).toFixed(0)}KB → ${(jsFeatSizeAfter/1024).toFixed(0)}KB (${Math.round((1 - jsFeatSizeAfter/jsFeatSizeBefore) * 100)}% smaller)\n`);

    // ── Summary ──
    const totalBefore = cssSizeBefore + jsCoreSizeBefore + jsI18nSizeBefore + jsFeatSizeBefore;
    const totalAfter = cssSizeAfter + jsCoreSizeAfter + jsI18nSizeAfter + jsFeatSizeAfter;
    console.log('═══════════════════════════════════════');
    console.log(`  TOTAL: ${(totalBefore/1024).toFixed(0)}KB → ${(totalAfter/1024).toFixed(0)}KB (${Math.round((1 - totalAfter/totalBefore) * 100)}% smaller)`);
    console.log(`  HTTP Requests: ~28 → 4`);
    console.log('═══════════════════════════════════════');
    console.log('\n✅ Bundles written to assets/dist/');
    console.log('   - styles.bundle.css');
    console.log('   - core.bundle.js');
    console.log('   - i18n.bundle.js');
    console.log('   - features.bundle.js\n');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});

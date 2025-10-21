// Simple CSS/JS Minifier
const fs = require('fs');
const path = require('path');

// Simple CSS minification
function minifyCSS(css) {
    return css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove whitespace
        .replace(/\s+/g, ' ')
        // Remove spaces around special characters
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        // Remove last semicolon in block
        .replace(/;}/g, '}')
        .trim();
}

// Simple JS minification
function minifyJS(js) {
    return js
        // Remove single-line comments (but preserve URLs)
        .replace(/([^:]|^)\/\/.*$/gm, '$1')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove spaces around operators and brackets
        .replace(/\s*([{}();,=<>!+\-*\/&|?:])\s*/g, '$1')
        .trim();
}

console.log('🚀 Starting minification...\n');

// Minify styles.css
try {
    const stylesPath = path.join(__dirname, 'assets/css/styles.css');
    const stylesContent = fs.readFileSync(stylesPath, 'utf8');
    const minifiedStyles = minifyCSS(stylesContent);
    
    const originalSize = (stylesContent.length / 1024).toFixed(2);
    const minifiedSize = (minifiedStyles.length / 1024).toFixed(2);
    const savings = ((1 - minifiedStyles.length / stylesContent.length) * 100).toFixed(1);
    
    fs.writeFileSync(path.join(__dirname, 'assets/css/styles.min.css'), minifiedStyles);
    console.log(`✅ styles.css minified:`);
    console.log(`   Original: ${originalSize} KB`);
    console.log(`   Minified: ${minifiedSize} KB`);
    console.log(`   Saved: ${savings}%\n`);
} catch (err) {
    console.error('❌ Error minifying styles.css:', err.message);
}

// Minify faq-footer.css
try {
    const faqPath = path.join(__dirname, 'assets/css/faq-footer.css');
    const faqContent = fs.readFileSync(faqPath, 'utf8');
    const minifiedFaq = minifyCSS(faqContent);
    
    const originalSize = (faqContent.length / 1024).toFixed(2);
    const minifiedSize = (minifiedFaq.length / 1024).toFixed(2);
    const savings = ((1 - minifiedFaq.length / faqContent.length) * 100).toFixed(1);
    
    fs.writeFileSync(path.join(__dirname, 'assets/css/faq-footer.min.css'), minifiedFaq);
    console.log(`✅ faq-footer.css minified:`);
    console.log(`   Original: ${originalSize} KB`);
    console.log(`   Minified: ${minifiedSize} KB`);
    console.log(`   Saved: ${savings}%\n`);
} catch (err) {
    console.error('❌ Error minifying faq-footer.css:', err.message);
}

// Minify main.js
try {
    const mainJsPath = path.join(__dirname, 'assets/js/main.js');
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    const minifiedMainJs = minifyJS(mainJsContent);
    
    const originalSize = (mainJsContent.length / 1024).toFixed(2);
    const minifiedSize = (minifiedMainJs.length / 1024).toFixed(2);
    const savings = ((1 - minifiedMainJs.length / mainJsContent.length) * 100).toFixed(1);
    
    fs.writeFileSync(path.join(__dirname, 'assets/js/main.min.js'), minifiedMainJs);
    console.log(`✅ main.js minified:`);
    console.log(`   Original: ${originalSize} KB`);
    console.log(`   Minified: ${minifiedSize} KB`);
    console.log(`   Saved: ${savings}%\n`);
} catch (err) {
    console.error('❌ Error minifying main.js:', err.message);
}

// Minify faq.js
try {
    const faqJsPath = path.join(__dirname, 'assets/js/faq.js');
    const faqJsContent = fs.readFileSync(faqJsPath, 'utf8');
    const minifiedFaqJs = minifyJS(faqJsContent);
    
    const originalSize = (faqJsContent.length / 1024).toFixed(2);
    const minifiedSize = (minifiedFaqJs.length / 1024).toFixed(2);
    const savings = ((1 - minifiedFaqJs.length / faqJsContent.length) * 100).toFixed(1);
    
    fs.writeFileSync(path.join(__dirname, 'assets/js/faq.min.js'), minifiedFaqJs);
    console.log(`✅ faq.js minified:`);
    console.log(`   Original: ${originalSize} KB`);
    console.log(`   Minified: ${minifiedSize} KB`);
    console.log(`   Saved: ${savings}%\n`);
} catch (err) {
    console.error('❌ Error minifying faq.js:', err.message);
}

console.log('🎉 Minification complete!\n');
console.log('📝 Next steps:');
console.log('   1. Update index.html to use .min.css and .min.js files');
console.log('   2. Test the website');
console.log('   3. Deploy with minified files for faster loading\n');

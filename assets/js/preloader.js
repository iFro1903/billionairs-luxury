// Preloader: Remove when page is loaded
window.addEventListener('load', function() {
    const preloader = document.getElementById('pagePreloader');
    const body = document.body;
    
    // Minimum display time for smooth transition
    setTimeout(function() {
        preloader.classList.add('hidden');
        body.classList.add('loaded');
        
        // Remove preloader from DOM after animation
        setTimeout(function() {
            preloader.remove();
        }, 400);
    }, 300);
});

// Fallback - hide preloader after 3 seconds max
setTimeout(function() {
    const preloader = document.getElementById('pagePreloader');
    if (preloader) {
        preloader.classList.add('hidden');
        document.body.classList.add('loaded');
    }
}, 3000);

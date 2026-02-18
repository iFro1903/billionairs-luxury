// Visitor Tracking
(function() {
    try {
        let sid = sessionStorage.getItem('_bv_sid');
        if (!sid) {
            sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
            sessionStorage.setItem('_bv_sid', sid);
        }
        // Only track once per session per page
        const trackKey = '_bv_' + location.pathname;
        if (sessionStorage.getItem(trackKey)) return;
        sessionStorage.setItem(trackKey, '1');

        let email = null;
        try { email = localStorage.getItem('userEmail'); } catch(e) {}

        fetch('/api/track-visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page: location.pathname,
                referrer: document.referrer || '',
                sessionId: sid,
                email: email
            })
        }).catch(function(){});
    } catch(e) {}
})();

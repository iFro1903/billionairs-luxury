// Emergency Mode Check
if (!window.location.pathname.includes('404') && 
    !window.location.pathname.includes('admin')) {
    fetch('/api/check-emergency')
        .then(res => res.json())
        .then(data => {
            if (data.isActive) {
                window.location.replace('/404.html');
            }
        })
        .catch(() => {});
}

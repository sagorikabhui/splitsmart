// Apply saved theme on every page load
function applyTheme() {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const theme = settings.theme || 'light';

    if (theme === 'dark') {
        document.documentElement.style.setProperty('--background', '#1a1a2e');
        document.documentElement.style.setProperty('--white', '#16213e');
        document.documentElement.style.setProperty('--text-dark', '#ffffff');
        document.documentElement.style.setProperty('--border', '#2d2d4e');
        document.documentElement.style.setProperty('--shadow', '0 2px 15px rgba(0,0,0,0.3)');
    } else if (theme === 'purple') {
        document.documentElement.style.setProperty('--background', '#f0e6ff');
        document.documentElement.style.setProperty('--white', '#ffffff');
        document.documentElement.style.setProperty('--text-dark', '#2C3E50');
        document.documentElement.style.setProperty('--border', '#d4b3ff');
        document.documentElement.style.setProperty('--shadow', '0 2px 15px rgba(142,68,173,0.15)');
    } else {
        document.documentElement.style.setProperty('--background', '#F8F4FF');
        document.documentElement.style.setProperty('--white', '#ffffff');
        document.documentElement.style.setProperty('--text-dark', '#2C3E50');
        document.documentElement.style.setProperty('--border', '#E8D5F5');
        document.documentElement.style.setProperty('--shadow', '0 2px 15px rgba(142,68,173,0.1)');
    }
}

// Apply theme immediately
applyTheme();
function applyTheme() {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const theme = settings.theme || 'light';

    if (theme === 'dark') {
        document.documentElement.style.setProperty('--background', '#0f0f1a');
        document.documentElement.style.setProperty('--white', '#1a1a2e');
        document.documentElement.style.setProperty('--card-bg', '#1e1e35');
        document.documentElement.style.setProperty('--text-dark', '#ffffff');
        document.documentElement.style.setProperty('--text-gray', '#aaaaaa');
        document.documentElement.style.setProperty('--text-muted', '#777777');
        document.documentElement.style.setProperty('--border', '#2d2d4e');
        document.documentElement.style.setProperty('--border-light', '#252540');
        document.documentElement.style.setProperty('--shadow', '0 2px 15px rgba(0,0,0,0.3)');
        document.documentElement.style.setProperty('--shadow-hover', '0 5px 25px rgba(0,0,0,0.4)');
        document.documentElement.style.setProperty('--input-bg', '#252540');
        document.documentElement.style.setProperty('--hover-bg', 'rgba(255,255,255,0.05)');
        // document.body.style.background = '#0f0f1a';
        if (document.body) document.body.style.background = '#0f0f1a';

    } else if (theme === 'purple') {
        document.documentElement.style.setProperty('--background', '#f0e6ff');
        document.documentElement.style.setProperty('--white', '#ffffff');
        document.documentElement.style.setProperty('--card-bg', '#ffffff');
        document.documentElement.style.setProperty('--text-dark', '#2C3E50');
        document.documentElement.style.setProperty('--text-gray', '#7F8C8D');
        document.documentElement.style.setProperty('--text-muted', '#999999');
        document.documentElement.style.setProperty('--border', '#d4b3ff');
        document.documentElement.style.setProperty('--border-light', '#ead5ff');
        document.documentElement.style.setProperty('--shadow', '0 2px 15px rgba(142,68,173,0.15)');
        document.documentElement.style.setProperty('--shadow-hover', '0 5px 25px rgba(142,68,173,0.25)');
        document.documentElement.style.setProperty('--input-bg', '#ffffff');
        document.documentElement.style.setProperty('--hover-bg', 'rgba(106,27,154,0.05)');
        // document.body.style.background = '#f0e6ff';
         if (document.body) document.body.style.background = '#f0e6ff';

    } else {
        document.documentElement.style.setProperty('--background', '#F8F4FF');
        document.documentElement.style.setProperty('--white', '#FFFFFF');
        document.documentElement.style.setProperty('--card-bg', '#FFFFFF');
        document.documentElement.style.setProperty('--text-dark', '#2C3E50');
        document.documentElement.style.setProperty('--text-gray', '#7F8C8D');
        document.documentElement.style.setProperty('--text-muted', '#999999');
        document.documentElement.style.setProperty('--border', '#E8D5F5');
        document.documentElement.style.setProperty('--border-light', '#f5f0ff');
        document.documentElement.style.setProperty('--shadow', '0 2px 15px rgba(142,68,173,0.1)');
        document.documentElement.style.setProperty('--shadow-hover', '0 5px 25px rgba(142,68,173,0.2)');
        document.documentElement.style.setProperty('--input-bg', '#FFFFFF');
        document.documentElement.style.setProperty('--hover-bg', 'rgba(106,27,154,0.05)');
        // document.body.style.background = '#F8F4FF';
         if (document.body) document.body.style.background = '#F8F4FF';
    
    }
}

applyTheme();
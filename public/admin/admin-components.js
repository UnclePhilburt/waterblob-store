// Shared UI Components for Admin Panel

// Global Top Bar Component
function createGlobalTopBar() {
    const topBar = document.createElement('div');
    topBar.id = 'globalTopBar';
    topBar.innerHTML = `
        <style>
            #globalTopBar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 60px;
                background: var(--card-bg);
                backdrop-filter: blur(20px);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 2rem;
                z-index: 1000;
            }

            #globalTopBar .search-container {
                flex: 1;
                max-width: 500px;
                margin: 0 2rem;
            }

            #globalSearch {
                width: 100%;
                padding: 0.75rem 1rem 0.75rem 2.5rem;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                color: var(--text-primary);
                font-size: 0.875rem;
                transition: all 0.3s;
            }

            #globalSearch:focus {
                outline: none;
                border-color: var(--accent-primary);
                box-shadow: 0 0 0 3px var(--accent-glow);
            }

            .search-icon {
                position: absolute;
                left: 0.75rem;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-secondary);
            }

            .top-bar-actions {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .icon-button {
                position: relative;
                width: 40px;
                height: 40px;
                border-radius: 8px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                color: var(--text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                font-size: 1.25rem;
            }

            .icon-button:hover {
                background: var(--hover-bg);
                border-color: var(--accent-primary);
            }

            .icon-button .badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: var(--danger);
                color: white;
                border-radius: 10px;
                padding: 0.125rem 0.375rem;
                font-size: 0.625rem;
                font-weight: 700;
                min-width: 18px;
                text-align: center;
            }

            .dropdown-menu {
                position: absolute;
                top: calc(100% + 0.5rem);
                right: 0;
                background: var(--card-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 0.5rem;
                min-width: 300px;
                max-height: 400px;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                display: none;
            }

            .dropdown-menu.show {
                display: block;
            }

            .notification-item {
                padding: 0.75rem;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s;
                border-left: 3px solid transparent;
            }

            .notification-item:hover {
                background: var(--hover-bg);
            }

            .notification-item.unread {
                border-left-color: var(--accent-primary);
                background: rgba(139, 92, 246, 0.05);
            }

            .notification-title {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0.25rem;
            }

            .notification-message {
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-bottom: 0.25rem;
            }

            .notification-time {
                font-size: 0.75rem;
                color: var(--text-muted);
            }

            .search-results {
                position: absolute;
                top: calc(100% + 0.5rem);
                left: 0;
                right: 0;
                background: var(--card-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                max-height: 400px;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                display: none;
            }

            .search-results.show {
                display: block;
            }

            .search-result-item {
                padding: 0.75rem 1rem;
                cursor: pointer;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .search-result-item:hover {
                background: var(--hover-bg);
            }

            .search-result-icon {
                font-size: 1.5rem;
            }

            .search-result-content {
                flex: 1;
            }

            .search-result-title {
                color: var(--text-primary);
                font-weight: 500;
            }

            .search-result-subtitle {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            body {
                padding-top: 60px;
            }
        </style>

        <div class="logo-section">
            <a href="/admin/hub.html" style="text-decoration: none; color: var(--accent-primary); font-weight: 700; font-size: 1.25rem;">
                💧 Water Blob®
            </a>
        </div>

        <div class="search-container" style="position: relative;">
            <span class="search-icon">🔍</span>
            <input type="text" id="globalSearch" placeholder="Search everything... (Press '/' to focus)" />
            <div class="search-results" id="searchResults"></div>
        </div>

        <div class="top-bar-actions">
            <button class="icon-button" id="themeToggle" title="Toggle Theme (Press 't')">
                <span id="themeIcon">🌙</span>
            </button>

            <button class="icon-button" id="shortcutsButton" title="Keyboard Shortcuts (Press '?')">
                ⌨️
            </button>

            <div style="position: relative;">
                <button class="icon-button" id="notificationsButton">
                    🔔
                    <span class="badge" id="notificationBadge" style="display: none;">0</span>
                </button>
                <div class="dropdown-menu" id="notificationsDropdown">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color); margin-bottom: 0.5rem;">
                        <h4 style="margin: 0; color: var(--text-primary);">Notifications</h4>
                        <button onclick="NotificationManager.markAllAsRead()" style="background: none; border: none; color: var(--accent-primary); cursor: pointer; font-size: 0.875rem;">
                            Mark all read
                        </button>
                    </div>
                    <div id="notificationsList"></div>
                </div>
            </div>

            <button class="icon-button" onclick="logout()" title="Logout">
                🚪
            </button>
        </div>
    `;

    document.body.insertBefore(topBar, document.body.firstChild);

    // Initialize functionality
    initGlobalSearch();
    initNotifications();
    initThemeToggle();
    initShortcutsButton();
}

function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchResults = document.getElementById('searchResults');

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim().toLowerCase();

        if (query.length < 2) {
            searchResults.classList.remove('show');
            return;
        }

        searchTimeout = setTimeout(async () => {
            const results = await performGlobalSearch(query);
            displaySearchResults(results);
        }, 300);
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => searchResults.classList.remove('show'), 200);
    });
}

async function performGlobalSearch(query) {
    const results = [];

    // Search pages
    const pages = [
        { title: 'Dashboard', icon: '📊', url: '/admin/', keywords: ['dashboard', 'overview', 'stats'] },
        { title: 'Products', icon: '🛍️', url: '/admin/products.html', keywords: ['products', 'inventory', 'items'] },
        { title: 'Orders', icon: '📦', url: '/admin/orders.html', keywords: ['orders', 'sales', 'purchases'] },
        { title: 'Analytics', icon: '📈', url: '/admin/analytics.html', keywords: ['analytics', 'visitors', 'tracking'] },
        { title: 'Activity Log', icon: '🔍', url: '/admin/activity.html', keywords: ['activity', 'log', 'history'] },
        { title: 'Settings', icon: '⚙️', url: '/admin/settings.html', keywords: ['settings', 'config', 'preferences'] }
    ];

    pages.forEach(page => {
        if (page.title.toLowerCase().includes(query) || page.keywords.some(k => k.includes(query))) {
            results.push({
                type: 'page',
                icon: page.icon,
                title: page.title,
                subtitle: 'Page',
                url: page.url
            });
        }
    });

    // Search products
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const products = await response.json();
            products.forEach(product => {
                if (product.name.toLowerCase().includes(query) ||
                    product.description?.toLowerCase().includes(query)) {
                    results.push({
                        type: 'product',
                        icon: '🛍️',
                        title: product.name,
                        subtitle: `Product - $${product.price}`,
                        url: `/admin/product-add.html?id=${product.id}`
                    });
                }
            });
        }
    } catch (error) {
        console.error('Search error:', error);
    }

    return results.slice(0, 10);
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');

    if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No results found</div>';
    } else {
        searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="window.location.href='${result.url}'">
                <span class="search-result-icon">${result.icon}</span>
                <div class="search-result-content">
                    <div class="search-result-title">${result.title}</div>
                    <div class="search-result-subtitle">${result.subtitle}</div>
                </div>
            </div>
        `).join('');
    }

    searchResults.classList.add('show');
}

function initNotifications() {
    const button = document.getElementById('notificationsButton');
    const dropdown = document.getElementById('notificationsDropdown');
    const badge = document.getElementById('notificationBadge');

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        updateNotificationsList();
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
    });

    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Subscribe to notification updates
    NotificationManager.subscribe(updateNotificationBadge);
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const count = NotificationManager.getUnreadCount();

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function updateNotificationsList() {
    const list = document.getElementById('notificationsList');
    const notifications = NotificationManager.getAll();

    if (notifications.length === 0) {
        list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No notifications</div>';
        return;
    }

    list.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="handleNotificationClick('${notif.id}', '${notif.url || ''}')">
            <div class="notification-title">${notif.title}</div>
            <div class="notification-message">${notif.message}</div>
            <div class="notification-time">${formatTimeAgo(new Date(notif.timestamp))}</div>
        </div>
    `).join('');
}

function handleNotificationClick(id, url) {
    NotificationManager.markAsRead(id);
    updateNotificationsList();
    if (url) {
        window.location.href = url;
    }
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function initThemeToggle() {
    const button = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');

    updateThemeIcon();

    button.addEventListener('click', () => {
        ThemeManager.toggle();
        updateThemeIcon();
    });
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    const theme = ThemeManager.getCurrent();
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function initShortcutsButton() {
    const button = document.getElementById('shortcutsButton');
    button.addEventListener('click', () => {
        KeyboardShortcuts.showHelp();
    });
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createGlobalTopBar);
    } else {
        createGlobalTopBar();
    }
}

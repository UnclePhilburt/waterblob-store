// Shared authentication utilities for all admin pages
// This script should be included in all admin pages

const API_BASE = '';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Get user from localStorage
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Verify authentication and redirect if not authenticated
async function requireAuth() {
    const token = getAuthToken();

    if (!token) {
        console.log('No auth token found, redirecting to login...');
        window.location.href = '/admin/hub.html';
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.valid) {
                // Token is valid, store updated user info
                localStorage.setItem('user', JSON.stringify(data.user));
                return true;
            }
        }
    } catch (error) {
        console.error('Auth verification error:', error);
    }

    // Token invalid or error occurred
    console.log('Auth verification failed, redirecting to login...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/admin/hub.html';
    return false;
}

// Logout function
async function logout() {
    const token = getAuthToken();

    if (token) {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/admin/hub.html';
}

// Make authenticated API requests
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();

    if (!token) {
        window.location.href = '/admin/hub.html';
        throw new Error('No authentication token');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    // If unauthorized, redirect to login
    if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/admin/hub.html';
        throw new Error('Unauthorized');
    }

    return response;
}

// Initialize auth check on page load
(async function initAuth() {
    await requireAuth();

    // Load utilities and components in order (utils must load before components)
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    try {
        // Load utils first (components depend on it)
        await loadScript('admin-utils.js');
        // Then load components and tracker in parallel
        await Promise.all([
            loadScript('admin-components.js'),
            loadScript('activity-tracker.js')
        ]);
    } catch (error) {
        console.error('Failed to load admin scripts:', error);
    }
})();

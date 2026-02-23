/**
 * Mobile Navigation System for Admin Panel
 * Provides hamburger menu navigation for mobile devices
 */

class AdminMobileNav {
    constructor() {
        this.isOpen = false;
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1);
        return page || 'hub.html';
    }

    init() {
        // Check if we should show mobile nav based on authentication state
        if (!this.shouldShowNav()) {
            // If not authenticated yet, wait for authentication
            this.waitForAuth();
            return;
        }

        this.injectMobileNav();
        this.attachEventListeners();
    }

    shouldShowNav() {
        // Don't show on login screen
        const loginScreen = document.querySelector('.login-screen');
        if (loginScreen && loginScreen.style.display !== 'none') {
            return false;
        }

        // Check if authenticated hub/dashboard is visible
        const adminHub = document.querySelector('.admin-hub.authenticated');
        const adminDashboard = document.querySelector('.admin-dashboard');

        // For admin-hub.html, only show when authenticated class is present
        if (this.currentPage === 'hub.html') {
            return adminHub !== null;
        }

        // For index.html login page, don't show until authenticated
        if (this.currentPage === 'index.html') {
            const isLoginPage = document.querySelector('.login-container') !== null;
            if (isLoginPage) {
                return false;
            }
        }

        // For other admin pages, check if there's an auth token or if page requires auth
        const hasAuthToken = localStorage.getItem('authToken') !== null;
        return hasAuthToken || adminDashboard !== null;
    }

    waitForAuth() {
        // For pages with login screens, wait for authentication
        const checkInterval = setInterval(() => {
            if (this.shouldShowNav()) {
                clearInterval(checkInterval);
                this.injectMobileNav();
                this.attachEventListeners();
            }
        }, 500);

        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);
    }

    getPersonalizedWelcome() {
        // Get user data from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) return '💧 Water Blob® Admin';

        try {
            const user = JSON.parse(userStr);
            const username = user.username || 'Admin';

            // Fun welcome messages
            const welcomeMessages = [
                `Hey ${username}! 👋`,
                `Welcome back, ${username}!`,
                `Hi ${username}! 🌊`,
                `${username}'s Dashboard`,
                `What's up, ${username}?`,
                `Good to see you, ${username}!`,
                `${username} is in charge! 💪`,
                `Boss ${username} is here!`,
                `Captain ${username} reporting!`,
                `${username}'s Command Center`
            ];

            // Pick a random welcome message
            const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
            return welcomeMessages[randomIndex];
        } catch (e) {
            return '💧 Water Blob® Admin';
        }
    }

    injectMobileNav() {
        // Get logout button if it exists
        const existingLogout = document.querySelector('.logout-btn');

        // Get personalized welcome message
        const welcomeMessage = this.getPersonalizedWelcome();

        // Create mobile navigation HTML with top bar
        const navHTML = `
            <!-- Mobile Top Bar -->
            <div class="mobile-top-bar">
                <button class="mobile-nav-toggle" id="mobileNavToggle" aria-label="Toggle navigation">
                    <div class="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
                <div class="mobile-logo">${welcomeMessage}</div>
                ${existingLogout ? '' : '<div style="width: 40px;"></div>'}
            </div>

            <!-- Mobile Navigation Overlay -->
            <div class="mobile-nav-overlay" id="mobileNavOverlay"></div>

            <!-- Mobile Navigation Menu -->
            <nav class="mobile-nav-menu" id="mobileNavMenu">
                <div class="mobile-nav-header">
                    <h2>💧 Admin</h2>
                    <p>Navigation Menu</p>
                </div>

                <a href="/admin/hub.html" class="mobile-nav-link ${this.currentPage === 'hub.html' ? 'active' : ''}">
                    <span class="icon">🏠</span>
                    <span class="label">Hub</span>
                </a>

                <a href="/admin/" class="mobile-nav-link ${this.currentPage === 'index.html' && document.querySelector('.admin-hub') ? 'active' : ''}">
                    <span class="icon">📊</span>
                    <span class="label">Dashboard</span>
                </a>

                <a href="/admin/products.html" class="mobile-nav-link ${this.currentPage === 'products.html' ? 'active' : ''}">
                    <span class="icon">🛍️</span>
                    <span class="label">Products</span>
                </a>

                <a href="/admin/orders.html" class="mobile-nav-link ${this.currentPage === 'orders.html' ? 'active' : ''}">
                    <span class="icon">📦</span>
                    <span class="label">Orders</span>
                </a>

                <a href="/admin/analytics.html" class="mobile-nav-link ${this.currentPage === 'analytics.html' ? 'active' : ''}">
                    <span class="icon">📈</span>
                    <span class="label">Analytics</span>
                </a>

                <a href="/admin/activity.html" class="mobile-nav-link ${this.currentPage === 'activity.html' ? 'active' : ''}">
                    <span class="icon">🔍</span>
                    <span class="label">Activity</span>
                </a>

                <a href="/admin/settings.html" class="mobile-nav-link ${this.currentPage === 'settings.html' ? 'active' : ''}">
                    <span class="icon">⚙️</span>
                    <span class="label">Settings</span>
                </a>

                <a href="/admin/product-add.html" class="mobile-nav-link ${this.currentPage === 'product-add.html' ? 'active' : ''}">
                    <span class="icon">➕</span>
                    <span class="label">Add Product</span>
                </a>
            </nav>
        `;

        // Insert at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navHTML);

        // Move existing logout button to top bar if it exists
        if (existingLogout) {
            const topBar = document.querySelector('.mobile-top-bar');
            if (topBar) {
                topBar.appendChild(existingLogout);
            }
        }
    }

    attachEventListeners() {
        const toggle = document.getElementById('mobileNavToggle');
        const overlay = document.getElementById('mobileNavOverlay');
        const menu = document.getElementById('mobileNavMenu');

        if (!toggle || !overlay || !menu) return;

        // Toggle button click
        toggle.addEventListener('click', () => this.toggleNav());

        // Overlay click to close
        overlay.addEventListener('click', () => this.closeNav());

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeNav();
            }
        });

        // Handle link clicks
        const navLinks = menu.querySelectorAll('.mobile-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Don't close immediately on logout link
                if (!link.textContent.includes('Logout')) {
                    this.closeNav();
                }
            });
        });

        // Prevent scroll on body when menu is open
        const preventScroll = (e) => {
            if (this.isOpen && !menu.contains(e.target)) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchmove', preventScroll, { passive: false });
    }

    toggleNav() {
        if (this.isOpen) {
            this.closeNav();
        } else {
            this.openNav();
        }
    }

    openNav() {
        const toggle = document.getElementById('mobileNavToggle');
        const overlay = document.getElementById('mobileNavOverlay');
        const menu = document.getElementById('mobileNavMenu');

        this.isOpen = true;
        toggle?.classList.add('active');
        overlay?.classList.add('active');
        menu?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeNav() {
        const toggle = document.getElementById('mobileNavToggle');
        const overlay = document.getElementById('mobileNavOverlay');
        const menu = document.getElementById('mobileNavMenu');

        this.isOpen = false;
        toggle?.classList.remove('active');
        overlay?.classList.remove('active');
        menu?.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize mobile navigation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminMobileNav = new AdminMobileNav();
    });
} else {
    window.adminMobileNav = new AdminMobileNav();
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminMobileNav;
}

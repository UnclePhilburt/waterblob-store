// Activity Tracker - Logs all user actions to the backend

(function() {
    'use strict';

    const API_BASE = '';

    const ActivityTracker = {
        init() {
            this.trackPageView();
            this.trackClicks();
            this.trackFormSubmissions();
            this.trackInputChanges();
        },

        async logActivity(action, details = {}) {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                await fetch(API_BASE + '/api/activity/log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        action,
                        details: {
                            ...details,
                            page: window.location.pathname,
                            pageTitle: document.title,
                            timestamp: new Date().toISOString()
                        }
                    })
                });
            } catch (error) {
                console.error('Failed to log activity:', error);
            }
        },

        trackPageView() {
            this.logActivity('PAGE_VIEW', {
                url: window.location.href,
                referrer: document.referrer
            });
        },

        trackClicks() {
            document.addEventListener('click', (e) => {
                const element = e.target;
                const tagName = element.tagName.toLowerCase();

                let details = {
                    element: tagName,
                    x: e.clientX,
                    y: e.clientY
                };

                // Track button clicks
                if (tagName === 'button' || element.closest('button')) {
                    const button = tagName === 'button' ? element : element.closest('button');
                    details.buttonText = button.textContent.trim();
                    details.buttonId = button.id;
                    details.buttonClass = button.className;

                    this.logActivity('CLICK_BUTTON', details);
                }
                // Track link clicks
                else if (tagName === 'a' || element.closest('a')) {
                    const link = tagName === 'a' ? element : element.closest('a');
                    details.linkText = link.textContent.trim();
                    details.linkHref = link.href;
                    details.linkId = link.id;

                    this.logActivity('CLICK_LINK', details);
                }
                // Track other clickable elements
                else if (element.onclick || element.getAttribute('onclick')) {
                    details.elementId = element.id;
                    details.elementClass = element.className;
                    details.elementText = element.textContent.trim().substring(0, 50);

                    this.logActivity('CLICK', details);
                }
            }, true);
        },

        trackFormSubmissions() {
            document.addEventListener('submit', (e) => {
                const form = e.target;
                const formData = new FormData(form);
                const data = {};

                // Collect non-sensitive form data
                for (let [key, value] of formData.entries()) {
                    // Don't log passwords or sensitive fields
                    if (key.toLowerCase().includes('password') ||
                        key.toLowerCase().includes('secret') ||
                        key.toLowerCase().includes('token')) {
                        data[key] = '[REDACTED]';
                    } else if (typeof value === 'string' && value.length < 100) {
                        data[key] = value;
                    } else {
                        data[key] = '[FILE or LONG TEXT]';
                    }
                }

                this.logActivity('FORM_SUBMIT', {
                    formId: form.id,
                    formAction: form.action,
                    formMethod: form.method,
                    formData: data
                });
            }, true);
        },

        trackInputChanges() {
            // Track significant input changes (debounced)
            let debounceTimers = {};

            document.addEventListener('change', (e) => {
                const element = e.target;
                const tagName = element.tagName.toLowerCase();

                if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
                    clearTimeout(debounceTimers[element.id || element.name]);

                    debounceTimers[element.id || element.name] = setTimeout(() => {
                        let value = element.value;

                        // Redact sensitive fields
                        if (element.type === 'password' ||
                            element.name.toLowerCase().includes('password') ||
                            element.name.toLowerCase().includes('secret')) {
                            value = '[REDACTED]';
                        } else if (element.type === 'file') {
                            value = element.files[0]?.name || '[FILE]';
                        } else if (value.length > 50) {
                            value = value.substring(0, 50) + '...';
                        }

                        this.logActivity('INPUT_CHANGE', {
                            inputType: element.type,
                            inputName: element.name,
                            inputId: element.id,
                            value: value,
                            label: element.labels?.[0]?.textContent.trim() || null
                        });
                    }, 1000);
                }
            }, true);
        }
    };

    // Initialize tracker when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ActivityTracker.init());
    } else {
        ActivityTracker.init();
    }

    // Export for manual tracking if needed
    window.ActivityTracker = ActivityTracker;
})();

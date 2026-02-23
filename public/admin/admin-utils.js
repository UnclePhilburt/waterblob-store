// Shared utility functions for admin panel

// Theme Management
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('adminTheme') || 'dark';
        this.setTheme(savedTheme);
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('adminTheme', theme);
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
        return next;
    },

    getCurrent() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }
};

// Notification System
const NotificationManager = {
    notifications: [],
    listeners: [],

    init() {
        // Load notifications from localStorage
        const saved = localStorage.getItem('adminNotifications');
        if (saved) {
            this.notifications = JSON.parse(saved);
        }
    },

    add(notification) {
        const newNotif = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotif);

        // Keep only last 100
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }

        this.save();
        this.notify();
        return newNotif;
    },

    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            this.save();
            this.notify();
        }
    },

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.save();
        this.notify();
    },

    delete(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.save();
        this.notify();
    },

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    },

    getAll() {
        return this.notifications;
    },

    save() {
        localStorage.setItem('adminNotifications', JSON.stringify(this.notifications));
    },

    subscribe(callback) {
        this.listeners.push(callback);
    },

    notify() {
        this.listeners.forEach(callback => callback(this.notifications));
    }
};

// Keyboard Shortcuts
const KeyboardShortcuts = {
    shortcuts: {
        'g h': { action: () => window.location.href = '/admin/hub.html', description: 'Go to Hub' },
        'g d': { action: () => window.location.href = '/admin/', description: 'Go to Dashboard' },
        'g p': { action: () => window.location.href = '/admin/products.html', description: 'Go to Products' },
        'g o': { action: () => window.location.href = '/admin/orders.html', description: 'Go to Orders' },
        'g a': { action: () => window.location.href = '/admin/activity.html', description: 'Go to Activity Log' },
        '/': { action: () => document.getElementById('globalSearch')?.focus(), description: 'Focus Search' },
        'n': { action: () => window.location.href = '/admin/product-add.html', description: 'New Product' },
        't': { action: () => ThemeManager.toggle(), description: 'Toggle Theme' },
        '?': { action: () => KeyboardShortcuts.showHelp(), description: 'Show Shortcuts' }
    },

    keySequence: '',
    sequenceTimeout: null,

    init() {
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key !== 'Escape' && e.key !== '/') return;
            }

            // Single key shortcuts
            if (this.shortcuts[e.key]) {
                e.preventDefault();
                this.shortcuts[e.key].action();
                return;
            }

            // Two-key sequence shortcuts
            clearTimeout(this.sequenceTimeout);
            this.keySequence += e.key;

            if (this.shortcuts[this.keySequence]) {
                e.preventDefault();
                this.shortcuts[this.keySequence].action();
                this.keySequence = '';
            } else {
                this.sequenceTimeout = setTimeout(() => {
                    this.keySequence = '';
                }, 1000);
            }
        });
    },

    showHelp() {
        const helpHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
                <div style="background: var(--bg-secondary); padding: 2rem; border-radius: 16px; max-width: 600px; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
                    <h2 style="margin-bottom: 1.5rem; color: var(--accent-primary);">⌨️ Keyboard Shortcuts</h2>
                    <div style="display: grid; gap: 1rem;">
                        ${Object.entries(this.shortcuts).map(([key, data]) => `
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-primary);">${data.description}</span>
                                <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.75rem; border-radius: 4px; font-family: monospace; border: 1px solid var(--border-color);">${key}</kbd>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="margin-top: 1.5rem; width: 100%; padding: 0.75rem; background: var(--accent-primary); color: white; border: none; border-radius: 8px; cursor: pointer;">Close</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', helpHTML);
    }
};

// Export to CSV/Excel
const ExportManager = {
    downloadCSV(data, filename) {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    },

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const escaped = String(value).replace(/"/g, '""');
                    return escaped.includes(',') ? `"${escaped}"` : escaped;
                }).join(',')
            )
        ];

        return csvRows.join('\n');
    },

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index];
            });
            data.push(obj);
        }

        return data;
    }
};

// Chart Helper (using simple Canvas API)
const ChartHelper = {
    drawLineChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const padding = options.padding || 40;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', width / 2, height / 2);
            return;
        }

        // Find min/max
        const values = data.map(d => d.value);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min || 1;

        // Draw axes
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw line
        const stepX = (width - padding * 2) / (data.length - 1 || 1);
        const stepY = (height - padding * 2) / range;

        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, i) => {
            const x = padding + i * stepX;
            const y = height - padding - (point.value - min) * stepY;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = '#8b5cf6';
        data.forEach((point, i) => {
            const x = padding + i * stepX;
            const y = height - padding - (point.value - min) * stepY;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';

        data.forEach((point, i) => {
            if (i % Math.ceil(data.length / 6) === 0) { // Show ~6 labels
                const x = padding + i * stepX;
                ctx.fillText(point.label, x, height - padding + 20);
            }
        });
    },

    drawBarChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const padding = options.padding || 40;

        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', width / 2, height / 2);
            return;
        }

        const max = Math.max(...data.map(d => d.value));
        const barWidth = (width - padding * 2) / data.length * 0.8;
        const barGap = (width - padding * 2) / data.length * 0.2;

        data.forEach((item, i) => {
            const x = padding + i * (barWidth + barGap);
            const barHeight = (item.value / max) * (height - padding * 2);
            const y = height - padding - barHeight;

            // Draw bar
            const gradient = ctx.createLinearGradient(x, y, x, height - padding);
            gradient.addColorStop(0, '#8b5cf6');
            gradient.addColorStop(1, '#6366f1');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, height - padding + 20);

            // Draw value
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(item.value, x + barWidth / 2, y - 5);
        });
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
    window.NotificationManager = NotificationManager;
    window.KeyboardShortcuts = KeyboardShortcuts;
    window.ExportManager = ExportManager;
    window.ChartHelper = ChartHelper;

    // Auto-initialize
    document.addEventListener('DOMContentLoaded', () => {
        ThemeManager.init();
        NotificationManager.init();
        KeyboardShortcuts.init();
    });
}

const CONFIG = {
    // Use Render backend, or localhost for local dev
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'https://waterblob-store.onrender.com'  // Use Render even locally (no local backend)
        : 'https://waterblob-store.onrender.com',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your_publishable_key_here'
};

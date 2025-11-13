const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check for Render
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api', (req, res) => res.json({ status: 'running' }));

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});

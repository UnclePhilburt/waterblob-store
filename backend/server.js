// Load environment variables
try {
    require('dotenv').config();
} catch (e) {
    console.log('dotenv not loaded, using environment variables');
}

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (simple version)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static files from frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

console.log('Frontend will be served from:', frontendPath);

// API Routes
app.get('/api', (req, res) => {
    res.json({
        status: 'running',
        message: 'Water Blob Store API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Catch-all for frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
const startServer = () => {
    try {
        app.listen(PORT, '0.0.0.0', () => {
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('  ✅ WATER BLOB STORE - RUNNING');
            console.log('═══════════════════════════════════════');
            console.log(`  Port:        ${PORT}`);
            console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`  Frontend:    ${frontendPath}`);
            console.log('═══════════════════════════════════════');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Start!
startServer();

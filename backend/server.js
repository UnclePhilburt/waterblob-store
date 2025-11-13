console.log('🚀 STARTING SERVER...');
console.log('Node version:', process.version);
console.log('Current directory:', __dirname);
console.log('Process cwd:', process.cwd());

// Load environment variables
console.log('Loading dotenv...');
try {
    require('dotenv').config();
    console.log('✅ dotenv loaded');
} catch (e) {
    console.log('⚠️ dotenv not loaded:', e.message);
}

console.log('Loading express...');
const express = require('express');
console.log('✅ express loaded');

console.log('Loading path...');
const path = require('path');
console.log('✅ path loaded');

console.log('Creating express app...');
const app = express();
console.log('✅ express app created');

const PORT = process.env.PORT || 3000;
console.log('Port:', PORT);

// Basic middleware
console.log('Setting up middleware...');
app.use(express.json());
console.log('✅ JSON middleware');
app.use(express.urlencoded({ extended: true }));
console.log('✅ URL encoded middleware');

// CORS (simple version)
console.log('Setting up CORS...');
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
console.log('✅ CORS middleware');

// Serve static files from frontend
console.log('Setting up static file serving...');
const frontendPath = path.join(__dirname, '../frontend');
console.log('Frontend path:', frontendPath);

// Check if directory exists
const fs = require('fs');
if (fs.existsSync(frontendPath)) {
    console.log('✅ Frontend directory EXISTS');
    const files = fs.readdirSync(frontendPath);
    console.log('Files in frontend:', files.join(', '));
} else {
    console.error('❌ Frontend directory DOES NOT EXIST:', frontendPath);
}

app.use(express.static(frontendPath));
console.log('✅ Static file middleware configured');

// API Routes
console.log('Setting up API routes...');
app.get('/api', (req, res) => {
    console.log('📡 API route hit');
    res.json({
        status: 'running',
        message: 'Water Blob Store API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    console.log('📡 Health check hit');
    res.json({ status: 'ok' });
});
console.log('✅ API routes configured');

// Catch-all for frontend routes
console.log('Setting up catch-all route...');
app.get('*', (req, res) => {
    console.log('📄 Serving index.html for:', req.url);
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error('❌ index.html NOT FOUND at:', indexPath);
        res.status(404).send('index.html not found');
    }
});
console.log('✅ Catch-all route configured');

// Error handling middleware
console.log('Setting up error handler...');
app.use((err, req, res, next) => {
    console.error('❌❌❌ ERROR CAUGHT ❌❌❌');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
console.log('✅ Error handler configured');

// Start server
const startServer = () => {
    console.log('');
    console.log('🔥🔥🔥 ATTEMPTING TO START SERVER 🔥🔥🔥');
    console.log('');

    try {
        console.log('Calling app.listen...');
        console.log(`Binding to 0.0.0.0:${PORT}`);

        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('  ✅✅✅ SERVER IS FUCKING RUNNING ✅✅✅');
            console.log('═══════════════════════════════════════');
            console.log(`  Port:        ${PORT}`);
            console.log(`  Host:        0.0.0.0`);
            console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`  Frontend:    ${frontendPath}`);
            console.log(`  Process ID:  ${process.pid}`);
            console.log('═══════════════════════════════════════');
            console.log('');
        });

        server.on('error', (err) => {
            console.error('');
            console.error('❌❌❌ SERVER ERROR ❌❌❌');
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            console.error('Full error:', err);
            console.error('');

            if (err.code === 'EADDRINUSE') {
                console.error(`🔥 Port ${PORT} is already in use!`);
            }

            process.exit(1);
        });

        console.log('✅ Listen call completed');

    } catch (error) {
        console.error('');
        console.error('❌❌❌ CATCH BLOCK - STARTUP FAILED ❌❌❌');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('');
        process.exit(1);
    }
};

// Handle shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('⚠️ Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Catch all uncaught errors
process.on('uncaughtException', (err) => {
    console.error('');
    console.error('❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('');
    console.error('❌❌❌ UNHANDLED REJECTION ❌❌❌');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    console.error('');
    process.exit(1);
});

// Start!
console.log('');
console.log('🚀🚀🚀 CALLING startServer() 🚀🚀🚀');
console.log('');
startServer();
